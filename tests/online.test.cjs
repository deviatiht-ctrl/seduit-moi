const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const source = name => fs.readFileSync(`${__dirname}/../${name}`, 'utf8');
const AUTH_ID = '11111111-1111-4111-8111-111111111111';
const LOCAL_ID = 'p_legacy_player';
const ROOM = 'ABC234';
const BASE = 'https://example.test/app/';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

async function flush() {
    for (let i = 0; i < 40; i++) await Promise.resolve();
}

function clock() {
    let next = 0;
    const pending = new Map();
    return {
        pending,
        setTimeout(fn, delay) {
            const id = ++next;
            pending.set(id, { fn, delay });
            return id;
        },
        clearTimeout(id) { pending.delete(id); },
        async run(id) {
            const timer = pending.get(id);
            assert.ok(timer, 'timer must still be pending');
            pending.delete(id);
            await timer.fn();
            await flush();
        }
    };
}

function fakeDocument() {
    const elements = new Map();
    function element(id = '') {
        const classes = new Set();
        let html = '';
        return {
            id,
            style: {},
            textContent: '',
            classList: {
                add(...names) { names.forEach(name => classes.add(name)); },
                remove(...names) { names.forEach(name => classes.delete(name)); },
                contains(name) { return classes.has(name); },
                toggle(name, force) {
                    const enabled = force === undefined ? !classes.has(name) : force;
                    if (enabled) classes.add(name); else classes.delete(name);
                    return enabled;
                }
            },
            set innerHTML(value) {
                html = value;
                for (const match of value.matchAll(/id=["']([^"']+)["'][^>]*>([^<]*)/g)) {
                    const child = element(match[1]);
                    child.textContent = match[2].trim();
                    elements.set(match[1], child);
                }
            },
            get innerHTML() { return html; },
            prepend(child) { elements.set(child.id, child); },
            appendChild(child) { if (child.id) elements.set(child.id, child); },
            addEventListener() {},
            setAttribute() {},
            remove() { elements.delete(this.id); }
        };
    }
    return {
        elements,
        body: element('body'),
        head: element('head'),
        createElement() { return element(); },
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element(id));
            return elements.get(id);
        },
        querySelectorAll() { return []; },
        addEventListener() {}
    };
}

function harness(options = {}) {
    const timers = clock();
    const values = new Map(Object.entries({
        seduitMoiPlayerId: LOCAL_ID,
        seduitMoiName: 'Host',
        seduitMoiRole: 'host',
        seduitMoiData: JSON.stringify({ language: 'fr' }),
        ...options.storage
    }));
    const storage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
    let href = options.href || `${BASE}pages/dashboard.html?room=${ROOM}`;
    const navigations = [];
    const location = {
        get href() { return href; },
        set href(value) { href = new URL(value, href).href; navigations.push(href); },
        get search() { return new URL(href).search; },
        get pathname() { return new URL(href).pathname; },
        get origin() { return new URL(href).origin; }
    };
    const room = {
        code: ROOM,
        host_player_id: AUTH_ID,
        host_name: 'Host',
        guest_player_id: null,
        guest_name: null,
        language: 'fr',
        situation: 'date',
        game_id: null,
        is_active: true,
        ...options.room
    };
    const queries = [];
    const channels = [];
    const removed = [];
    const events = [];
    const client = {
        auth: {
            async getSession() {
                events.push('session');
                return { data: { session: options.authId === null ? null : { user: { id: options.authId || AUTH_ID } } }, error: null };
            }
        },
        from(table) {
            const query = { table, operation: 'select', filters: [], columns: null };
            queries.push(query);
            let result;
            function execute() {
                if (!result) {
                    events.push(query.operation);
                    result = Promise.resolve().then(() => {
                        if (options.query) return options.query(query, room);
                        if (query.operation === 'update') Object.assign(room, query.values);
                        return { data: { ...room }, error: null };
                    });
                }
                return result;
            }
            const builder = {
                select(columns) { query.columns = columns; return this; },
                update(values) { query.operation = 'update'; query.values = values; return this; },
                eq(key, value) { query.filters.push(['eq', key, value]); return this; },
                or(value) { query.filters.push(['or', value]); return this; },
                single() { query.single = true; return execute(); },
                then(resolve, reject) { return execute().then(resolve, reject); }
            };
            return builder;
        },
        channel(name, config) {
            const handlers = [];
            const channel = {
                name, config, handlers, sent: [], tracked: [], state: {},
                on(type, filter, callback) { handlers.push({ type, filter, callback }); return this; },
                subscribe(callback) {
                    this.statusCallback = callback;
                    if (callback) this.subscription = callback('SUBSCRIBED');
                    return this;
                },
                async status(status) { if (this.statusCallback) await this.statusCallback(status); },
                async emit(type, event, payload) {
                    for (const handler of handlers) {
                        if (handler.type === type && handler.filter.event === event) await handler.callback(payload);
                    }
                },
                presenceState() { return this.state; },
                async track(value) { this.tracked.push(value); },
                async send(value) {
                    events.push('send');
                    this.sent.push(value);
                    if (options.send) return options.send(value);
                    return 'ok';
                }
            };
            channels.push(channel);
            return channel;
        },
        async removeChannel(channel) { removed.push(channel); }
    };
    const document = fakeDocument();
    const listeners = new Map();
    const errors = [];
    const context = vm.createContext({
        URL, URLSearchParams,
        console: { log() {}, warn() {}, error(...args) { errors.push(args); } },
        location, document, localStorage: storage,
        setTimeout: timers.setTimeout,
        clearTimeout: timers.clearTimeout,
        addEventListener(event, fn) {
            if (!listeners.has(event)) listeners.set(event, []);
            listeners.get(event).push(fn);
        },
        seduitAuth: { client, async getSession() { return { user: { id: AUTH_ID } }; } },
        userData: { name1: 'Host', name2: 'Guest', language: 'fr', situation: 'date' },
        createIcons() {}, loadUserData() {}, saveUserData() {}, displayNames() {},
        alert() {}, confirm() { return true; }
    });
    context.window = context;
    vm.runInContext(source('js/online.js'), context, { filename: 'js/online.js' });
    const online = context.seduitOnline;
    assert.equal(online.init(), true);
    return { context, online, client, room, queries, channels, removed, events, storage, location, navigations, timers, document, listeners, errors };
}

function scripts(html) {
    return Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi), match => ({
        src: /\bsrc\s*=\s*["']([^"']*)["']/i.exec(match[1])?.[1],
        body: match[2]
    }));
}

async function dashboard(role) {
    const h = harness({ room: role === 'guest' ? { host_player_id: 'another-host', guest_player_id: AUTH_ID, guest_name: 'Guest' } : {} });
    h.online.watchForGuest = async () => null;
    h.online.subscribeToGlobalPresence = () => null;
    h.online.watchRoomGame = async () => null;
    for (const script of scripts(source('pages/dashboard.html'))) {
        if (script.src === undefined && script.body.trim()) vm.runInContext(script.body, h.context, { filename: 'pages/dashboard.html' });
    }
    await flush();
    for (const listener of h.listeners.get('DOMContentLoaded') || []) await listener();
    await flush();
    assert.equal(h.online.myRole, role);
    assert.ok(h.online.roomChannel, 'dashboard should subscribe directly to the room');
    assert.equal(h.errors.length, 0, 'dashboard initialization should succeed');
    return h;
}

test('host rejoin uses authenticated UUID instead of the saved anonymous player ID', async () => {
    const h = harness({ storage: { seduitMoiUserId: 'stale-user-id' }, room: { guest_player_id: 'other-guest', guest_name: 'Guest' } });
    await h.online.joinRoom(' abc234 ', 'Host');
    assert.equal(h.online.myId, AUTH_ID);
    assert.notEqual(h.online.myId, LOCAL_ID);
    assert.equal(h.online.myRole, 'host');
    assert.equal(h.online.roomCode, ROOM);
    assert.equal(h.online.partnerName, 'Guest');
    assert.equal(h.storage.getItem('seduitMoiRole'), 'host');
    assert.equal(h.storage.getItem('seduitMoiPlayerId'), LOCAL_ID);
    assert.equal(h.queries.filter(query => query.operation === 'update').length, 0);
    assert.equal(h.events[0], 'session');
});

test('returning legacy guest is recognized after authentication changes their identity', async () => {
    const h = harness({ room: { host_player_id: 'another-host', guest_player_id: LOCAL_ID, guest_name: 'Guest' } });
    await h.online.joinRoom(ROOM, 'Guest');
    assert.equal(h.online.myId, AUTH_ID);
    assert.equal(h.online.myRole, 'guest');
    assert.equal(h.online.partnerName, 'Host');
    assert.equal(h.storage.getItem('seduitMoiRole'), 'guest');
    assert.equal(h.queries.filter(query => query.operation === 'update').length, 0);
    assert.equal(JSON.parse(h.storage.getItem('seduitMoiData')).name2, 'Guest');
});

test('a concurrent guest claim with zero updated rows rejects without saving membership', async () => {
    const h = harness({
        room: { host_player_id: 'another-host' },
        storage: { seduitMoiRole: '' },
        query(query, room) { return { data: query.operation === 'update' ? null : { ...room }, error: null }; }
    });
    await assert.rejects(h.online.joinRoom(ROOM, 'Guest'), /join_failed/);
    const update = h.queries.find(query => query.operation === 'update');
    assert.ok(update.single, 'the conditional update must return the claimed row');
    assert.deepEqual(update.filters, [['eq', 'code', ROOM], ['eq', 'is_active', true], ['or', 'guest_player_id.is.null,guest_player_id.eq.']]);
    assert.equal(update.values.guest_player_id, AUTH_ID);
    assert.equal(h.online.myRole, null);
    assert.equal(h.online.roomCode, null);
    assert.equal(h.storage.getItem('seduitMoiRoom'), null);
    assert.equal(h.storage.getItem('seduitMoiRole'), '');
});

test('room channel is assigned and connected before onConnected can broadcast', async () => {
    const h = harness();
    await h.online.joinRoom(ROOM, 'Host');
    let connected = 0;
    const channel = await h.online.subscribeToRoom(ROOM, {
        onConnected() {
            connected++;
            assert.equal(h.online.roomChannel, h.channels[0]);
            assert.equal(h.online.isConnected, true);
            h.online.broadcastState('tictactoe', { turn: 1 });
        }
    });
    await flush();
    assert.equal(connected, 1);
    assert.equal(channel.sent.length, 1);
    assert.equal(channel.sent[0].event, 'game_state');
    assert.equal(channel.tracked[0].player_id, AUTH_ID);
});

test('self presence join and leave are ignored while partner events are delivered', async () => {
    const h = harness();
    await h.online.joinRoom(ROOM, 'Host');
    const joined = [];
    const left = [];
    const channel = await h.online.subscribeToRoom(ROOM, {
        onPartnerJoined(players) { joined.push(...players); },
        onPartnerLeft(players) { left.push(...players); }
    });
    const self = { player_id: AUTH_ID, role: 'host' };
    const otherTab = { player_id: LOCAL_ID, role: 'host' };
    const partner = { player_id: 'guest-id', role: 'guest' };
    await channel.emit('presence', 'join', { newPresences: [self, otherTab] });
    await channel.emit('presence', 'leave', { leftPresences: [self, otherTab] });
    assert.equal(joined.length, 0);
    assert.equal(left.length, 0);
    await channel.emit('presence', 'join', { newPresences: [self, partner] });
    await channel.emit('presence', 'leave', { leftPresences: [partner, self] });
    assert.deepEqual(joined, [partner]);
    assert.deepEqual(left, [partner]);
});

test('own channel failures clear isConnected and notify connection status callbacks', async () => {
    const h = harness();
    const statuses = [];
    const channel = await h.online.subscribeToRoom(ROOM, { onConnectionStatus(status) { statuses.push(status); } });
    assert.equal(h.online.isConnected, true);
    for (const status of ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']) {
        await channel.status(status);
        assert.equal(h.online.isConnected, false);
        assert.equal(statuses.at(-1), status);
        await channel.status('SUBSCRIBED');
        assert.equal(h.online.isConnected, true);
    }
});

test('setRoomGame persists successfully before sending and awaits the broadcast acknowledgement', async () => {
    const persist = deferred();
    const acknowledgement = deferred();
    const h = harness({
        query(query) { assert.equal(query.operation, 'update'); return persist.promise; },
        send() { return acknowledgement.promise; }
    });
    h.online.myRole = 'host';
    h.online.myId = AUTH_ID;
    await h.online.subscribeToRoom(ROOM, {});
    let settled = false;
    const operation = h.online.setRoomGame('tictactoe').then(() => { settled = true; });
    await flush();
    assert.equal(h.channels[0].sent.length, 0);
    assert.equal(settled, false);
    const query = h.queries[0];
    assert.equal(query.values.game_id, 'tictactoe');
    assert.deepEqual(query.filters, [['eq', 'code', ROOM], ['eq', 'host_player_id', AUTH_ID], ['eq', 'is_active', true]]);
    persist.resolve({ data: { code: ROOM }, error: null });
    await flush();
    assert.equal(h.channels[0].sent.length, 1);
    assert.equal(h.channels[0].sent[0].event, 'host_navigation');
    assert.equal(h.channels[0].sent[0].payload.url, `${BASE}games/tictactoe.html?room=${ROOM}`);
    assert.equal(settled, false);
    acknowledgement.resolve('ok');
    await operation;
    assert.equal(settled, true);
    assert.deepEqual(h.events, ['update', 'send']);
});

test('setRoomGame never broadcasts a failed or zero-row persistence result', async () => {
    const h = harness({ query() { return { data: null, error: null }; } });
    h.online.myRole = 'host';
    await h.online.subscribeToRoom(ROOM, {});
    await assert.rejects(h.online.setRoomGame('tictactoe'), /room_update_failed/);
    assert.equal(h.channels[0].sent.length, 0);
});

test('watchRoomGame immediately catches a game selected before a late guest connected and cleans up', async () => {
    const h = harness({ room: { game_id: 'tictactoe' } });
    h.online.myRole = 'guest';
    h.online.roomCode = ROOM;
    await h.online.watchRoomGame(ROOM);
    assert.deepEqual(h.navigations, [`${BASE}games/tictactoe.html?room=${ROOM}`]);
    assert.equal(h.timers.pending.size, 1);
    const watcher = h.channels[0];
    assert.equal(watcher.handlers[0].type, 'postgres_changes');
    h.room.game_id = 'dis-moi';
    await watcher.emit('postgres_changes', 'UPDATE', { new: h.room });
    assert.equal(h.navigations.at(-1), `${BASE}games/dis-moi.html?room=${ROOM}`);
    h.room.game_id = 'apprend-moi';
    await h.timers.run(h.timers.pending.keys().next().value);
    assert.equal(h.navigations.at(-1), `${BASE}games/apprend-moi.html?room=${ROOM}`);
    await h.online.disconnect();
    assert.equal(h.timers.pending.size, 0);
    assert.ok(h.removed.includes(watcher));
    assert.equal(h.online._roomWatchChannel, null);
    const count = h.navigations.length;
    h.room.game_id = 'hot';
    await watcher.emit('postgres_changes', 'UPDATE', { new: h.room });
    assert.equal(h.navigations.length, count);
});

test('stopping a pending room lookup prevents stale navigation and polling timers', async () => {
    const lookup = deferred();
    const h = harness({ query() { return lookup.promise; } });
    h.online.myRole = 'guest';
    h.online.roomCode = ROOM;
    const watching = h.online.watchRoomGame(ROOM);
    await flush();
    assert.equal(h.queries.length, 1);
    await h.online.stopWatchingRoomGame();
    lookup.resolve({ data: { game_id: 'hot', is_active: true }, error: null });
    await watching;
    assert.equal(h.navigations.length, 0);
    assert.equal(h.timers.pending.size, 0);
    assert.equal(h.removed.length, 1);
});

test('an older room lookup cannot undo a newer host navigation broadcast', async () => {
    const lookup = deferred();
    const h = harness({ query() { return lookup.promise; } });
    h.online.myRole = 'guest';
    h.online.roomCode = ROOM;
    const watching = h.online.watchRoomGame(ROOM);
    await flush();
    const target = h.online.getGameURL('tictactoe');
    h.online.followHostNavigation(target);
    lookup.resolve({ data: { game_id: null, is_active: true }, error: null });
    await watching;
    assert.deepEqual(h.navigations, [target]);
    await h.online.stopWatchingRoomGame();
});

test('current game navigation and repeated host navigation never reload the page', async () => {
    const h = harness({ href: `${BASE}games/tictactoe.html?room=${ROOM}`, room: { game_id: 'tictactoe' } });
    h.online.myRole = 'guest';
    h.online.roomCode = ROOM;
    h.online.followHostNavigation(h.location.href);
    await h.online.watchRoomGame(ROOM);
    await h.timers.run(h.timers.pending.keys().next().value);
    assert.equal(h.navigations.length, 0);
    const next = h.online.getGameURL('dis-moi');
    h.online.followHostNavigation(next);
    h.online.followHostNavigation(next);
    assert.deepEqual(h.navigations, [next]);
    await h.online.stopWatchingRoomGame();
});

test('host navigation rejects external, cross-room and unknown game destinations', () => {
    const h = harness();
    h.online.myRole = 'guest';
    h.online.roomCode = ROOM;
    for (const target of [
        `https://evil.test/app/games/tictactoe.html?room=${ROOM}`,
        `//evil.test/app/games/tictactoe.html?room=${ROOM}`,
        `${BASE}games/tictactoe.html?room=XYZ789`,
        `${BASE}games/unknown.html?room=${ROOM}`,
        `${BASE}games/contact.html?room=${ROOM}`,
        `${BASE}pages/auth.html?room=${ROOM}`,
        'javascript:alert(1)',
        `${BASE}games/tictactoe.html`,
        `${BASE}games/tictactoe.html?room=${ROOM}&redirect=https://evil.test`
    ]) {
        h.online.followHostNavigation(target);
        assert.equal(h.navigations.length, 0, target);
    }
    assert.throws(() => h.online.getGameURL('unknown'), /invalid_game/);
    h.online.followHostNavigation(`../games/action-verite.html?room=${ROOM}`);
    assert.equal(h.navigations.length, 1);
    h.online.myRole = 'host';
    h.online.followHostNavigation(h.online.getGameURL('hot'));
    assert.equal(h.navigations.length, 1);
});

test('game banner handles self-only presence, partner return, grace timeout and own connection errors', async () => {
    const h = harness({ href: `${BASE}games/tictactoe.html?room=${ROOM}` });
    vm.runInContext(source('js/game-online-sync.js'), h.context, { filename: 'js/game-online-sync.js' });
    for (const listener of h.listeners.get('load') || []) await listener();
    assert.equal(h.errors.length, 0);
    assert.ok(h.document.elements.has('online-game-banner'));
    const status = h.document.getElementById('_online_partner_status');
    const dot = h.document.getElementById('_online_sync_dot');
    const channel = h.online.roomChannel;
    const self = { player_id: AUTH_ID, role: 'host', name: 'Host' };
    const partner = { player_id: 'guest-id', role: 'guest', name: 'Guest' };
    const sync = async players => {
        channel.state = { players };
        await channel.emit('presence', 'sync');
    };
    await sync([self]);
    assert.notEqual(status.style.color, '#22c55e');
    assert.equal(h.timers.pending.size, 1);
    const firstTimer = h.timers.pending.keys().next().value;
    assert.equal(h.timers.pending.get(firstTimer).delay, 4000);
    await sync([self]);
    assert.equal(h.timers.pending.size, 1);
    await sync([self, partner]);
    assert.equal(h.timers.pending.has(firstTimer), false);
    assert.equal(status.textContent, 'Guest (Connecté)');
    assert.equal(status.style.color, '#22c55e');
    await sync([self]);
    await h.timers.run(h.timers.pending.keys().next().value);
    assert.equal(status.textContent, 'Partenaire déconnecté');
    await sync([self, partner]);
    assert.equal(status.textContent, 'Guest (Connecté)');
    await sync([self]);
    const lostPartnerTimer = h.timers.pending.keys().next().value;
    await channel.status('CHANNEL_ERROR');
    assert.equal(h.online.isConnected, false);
    assert.equal(h.timers.pending.has(lostPartnerTimer), false);
    assert.equal(dot.textContent, 'Votre connexion est indisponible');
    assert.notEqual(status.textContent, 'Partenaire déconnecté');
    await sync([self]);
    assert.equal(h.timers.pending.size, 0);
    assert.notEqual(status.textContent, 'Partenaire déconnecté');
    await channel.status('SUBSCRIBED');
    await sync([self, partner]);
    assert.equal(status.textContent, 'Guest (Connecté)');
    assert.equal(dot.style.color, '#22c55e');
});

for (const game of ['action-verite', 'apprend-moi']) {
    test(`${game} includes each online script dependency exactly once in dependency order`, () => {
        const urls = scripts(source(`games/${game}.html`)).filter(script => script.src).map(script => new URL(script.src, `${BASE}games/${game}.html`));
        const dependencies = [
            url => url.pathname.endsWith('/supabase.js') && url.href.includes('@supabase/supabase-js'),
            url => url.pathname.endsWith('/js/lib/supabase-config.js'),
            url => url.pathname.endsWith('/js/online.js'),
            url => url.pathname.endsWith('/js/chat.js'),
            url => url.pathname.endsWith('/js/game-online-sync.js')
        ];
        let previous = -1;
        for (const dependency of dependencies) {
            const matches = urls.map((url, index) => dependency(url) ? index : -1).filter(index => index !== -1);
            assert.equal(matches.length, 1, `missing or duplicated dependency in ${game}: ${dependency}`);
            assert.ok(matches[0] > previous, 'dependencies must load before their consumers');
            previous = matches[0];
        }
    });
}

test('dashboard directly wires host navigation without requiring chat', async () => {
    const h = await dashboard('guest');
    assert.equal(h.context.seduitChat, undefined);
    assert.equal(typeof h.online._callbacks.onHostNavigation, 'function');
    const target = h.online.getGameURL('tictactoe');
    await h.online.roomChannel.emit('broadcast', 'host_navigation', { payload: { from: 'host', url: target } });
    assert.deepEqual(h.navigations, [target]);
});

test('all changed JavaScript and inline page scripts parse successfully', () => {
    for (const file of ['js/online.js', 'js/chat.js', 'js/game-online-sync.js', 'sw.js']) {
        assert.doesNotThrow(() => new vm.Script(source(file), { filename: file }));
    }
    for (const file of ['pages/dashboard.html', 'pages/auth.html', 'pages/online-lobby.html', 'games/action-verite.html', 'games/apprend-moi.html']) {
        for (const script of scripts(source(file))) {
            if (!script.src) assert.doesNotThrow(() => new vm.Script(script.body, { filename: file }));
        }
    }
});

test('saved game selection survives a failed navigation broadcast', async () => {
    const h = harness({ send() { throw new Error('network_unavailable'); } });
    await h.online.joinRoom(ROOM, 'Host');
    await h.online.subscribeToRoom(ROOM, {});
    await h.online.setRoomGame('tictactoe');
    assert.equal(h.room.game_id, 'tictactoe');
});

test('dashboard guest cannot choose a game even through a direct function call', async () => {
    const h = await dashboard('guest');
    h.online.setRoomGame = async () => assert.fail('guest must not save game selection');
    await vm.runInContext("goToGame('tictactoe')", h.context);
    assert.equal(h.navigations.length, 0);
});

test('dashboard stays put on failed persistence and allows a retry', async () => {
    const h = await dashboard('host');
    h.online.setRoomGame = async () => { throw new Error('database_unavailable'); };
    await vm.runInContext("goToGame('tictactoe')", h.context);
    assert.equal(h.navigations.length, 0);
    h.online.setRoomGame = async () => {};
    await vm.runInContext("goToGame('tictactoe')", h.context);
    assert.equal(h.navigations.length, 1);
});

test('dashboard goToGame awaits setRoomGame before navigating', async () => {
    const h = await dashboard('host');
    const channel = h.online.roomChannel;
    channel.state = { guest: [{ player_id: 'guest-id', role: 'guest', name: 'Guest' }] };
    await channel.emit('presence', 'join', { newPresences: channel.state.guest });
    await channel.emit('presence', 'sync');
    const persisted = deferred();
    const calls = [];
    h.online.setRoomGame = async gameId => { calls.push(gameId); await persisted.promise; };
    const navigation = vm.runInContext("goToGame('tictactoe')", h.context);
    await flush();
    assert.deepEqual(calls, ['tictactoe']);
    assert.equal(h.navigations.length, 0, 'navigation must not race room persistence');
    assert.ok(navigation && typeof navigation.then === 'function', 'goToGame must return its async operation');
    persisted.resolve();
    await navigation;
    assert.deepEqual(h.navigations, [`${BASE}games/tictactoe.html?room=${ROOM}`]);
});
