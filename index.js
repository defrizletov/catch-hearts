const HTML_ELEMENTS = {
    startButton: document.querySelector('#startGame'),
    gameContainer: document.querySelector('#gameContainer'),
    goButtons: [...document.querySelectorAll('#goButton')],
    allScreens: [...document.querySelectorAll('[data-screen]')],
    promoCodes: [...document.querySelectorAll('#promoCode')]
},
HEARTS_IMAGES = [
    './assets/images/heart0.png',
    './assets/images/heart1.png',
    './assets/images/heart2.gif'
],
GameConfig = {
    heartsBase: 10,
    heartsMultiplier: 5,
    vibrateDuration: 100,
    currentScreen: 0,
    width: 0,
    height: 0,
    level: 0,
    levelsCount: 3,
    heartsContainer: [],
    rendering: false,
    losed: false,
    inited: false
},
makeOnclick = (el, callback) => el.addEventListener('pointerdown', ({ isTrusted }) => isTrusted && callback()),
getRandomInt = (min, max) => {
    min = Math.ceil(min);

    return Math.floor(Math.random() * (Math.floor(max) - min + 1)) + min;
};

window.addEventListener('contextmenu', e => e.preventDefault());

makeOnclick(HTML_ELEMENTS.startButton, startGame);

HTML_ELEMENTS.goButtons.map(el => makeOnclick(el, nextLevel));
HTML_ELEMENTS.promoCodes.map(el => makeOnclick(el, copyPromocode(el)));

showScreen(0);

function initGame () {
    const {
        width,
        height
    } = HTML_ELEMENTS.gameContainer.getBoundingClientRect();

    GameConfig.width = width;
    GameConfig.height = height;
    GameConfig.inited = true;
};

function startGame () {
    if(GameConfig.rendering) return;

    showScreen(5);

    if(!GameConfig.inited) initGame();
    
    [...HTML_ELEMENTS.gameContainer.children].map(x => x.remove());
    
    const {
        width,
        height
    } = GameConfig;

    GameConfig.heartsContainer = new Array(GameConfig.heartsBase + GameConfig.heartsMultiplier * GameConfig.level)
    .fill()
    .map((_, index) => {
        const el = document.createElement('img');

        el.className = 'heart';

        el.src = HEARTS_IMAGES[Math.round(Math.random())];

        makeOnclick(el, () => clickHeart(index));
        
        return {
            el,
            x: getRandomInt(0, width - 82.5),
            y: height + index * 80
        };
    });

    HTML_ELEMENTS.gameContainer.append(...GameConfig.heartsContainer.map(x => x.el));

    GameConfig.rendering = true;

    lastPerformance = performance.now();

    requestAnimationFrame(renderHearts);
};

let lastPerformance = 0;

function renderHearts (now) {
    const delta = now - lastPerformance;

    lastPerformance = now;

    GameConfig.heartsContainer.map((heart, index) => {
        if(heart.removed) return;

        heart.x += (1.25 * Math.sin(0.0075 * now)) * [-1,1][index % 2];
        heart.y -= 0.25 * delta;

        heart.el.style.top = `${heart.y}px`;
        heart.el.style.left = `${heart.x}px`;

        if(heart.y < -160) showScreen(4);
    });

    if(GameConfig.rendering) requestAnimationFrame(renderHearts);
};

function clickHeart (index) {
    if(!GameConfig.rendering) return;

    vibrate();

    const heart = GameConfig.heartsContainer[index];
    heart.el.remove();
    heart.removed = true;

    const explosion = document.createElement('img');
    explosion.src = HEARTS_IMAGES[2];
    explosion.className = 'heart';
    explosion.style.pointerEvents = 'none';
    explosion.style.top = `${heart.y}px`;
    explosion.style.left = `${heart.x}px`;

    HTML_ELEMENTS.gameContainer.append(explosion);

    setTimeout(() => explosion.remove(), 500);

    checkResult();
};

function checkResult () {
    if(GameConfig.heartsContainer.length === GameConfig.heartsContainer.filter(x => x.removed).length) {
        if(GameConfig.level+1 === GameConfig.levelsCount) showScreen(3);
        else showScreen(GameConfig.level+1);
    };
};

function showScreen (screen) {
    GameConfig.rendering = screen === 5;

    GameConfig.currentScreen = screen;

    HTML_ELEMENTS.allScreens.map(el => {
        if(el.getAttribute('data-screen') === screen+'') return;

        el.style.opacity = 0;

        setTimeout(() => {
            if(GameConfig.currentScreen === screen) el.style.display = 'none';
        }, 750);
    });

    if(screen === 4) GameConfig.losed = true;

    const el = document.querySelector(`[data-screen="${screen}"]`);
    el.style.display = 'flex';
    el.style.opacity = 1;
};

function nextLevel () {
    if(GameConfig.level+1 === GameConfig.levelsCount) return showScreen(0);

    GameConfig.level++;

    if(GameConfig.losed) {
        GameConfig.level = 0;
        GameConfig.losed = false;
    };

    startGame();
};

function copyPromocode (el) {
    return () => {
        vibrate();

        el.focus();

        navigator.clipboard.writeText(el.innerText);
    };
};

function vibrate () {
    try {
        window.navigator?.vibrate?.(GameConfig.vibrateDuration);
    } catch {};
};