let assets = [
  "images/CHANGE.png",
  "images/circle.png"
];
let backgroundColor = "red"; // 背景色
let colors = ["red", "blue", "yellow", "green", "orange"]; // 背景色のリスト
const HIGH_SCORE_KEY = "WhiteOrBlackHighScore"; // ハイスコアのkey
const HIGH_SCORE_LENGTH = 5; // 保存するハイスコアの数
const ROWS = 5; // 落ちてくる列の数

const Circle = enchant.Class.create(enchant.Sprite, {
  /**
   * 落ちてくるサークルのクラス
   * @param  {Number} moveTime 落ち終わるまでの時間
   */
  initialize: function(moveTime) {
    enchant.Sprite.call(this, 64, 64);
    this.image = core.assets["images/circle.png"];
    this.x = this.width * getRandom(0, 4);
    this.y = -128;
    let modeRandom = getRandom(0, 1);
    if (modeRandom == 0) {
      this.frame = 2;
      this.mode = "black";
    } else {
      this.frame = 3;
      this.mode = "white";
    }

    this.tl.moveBy(0, core.height, moveTime);
  }
});

/**
 * ゲームのシーンを開始する
 * @return {enchant.Scene} 開始したシーン
 */
function gameSceneStart() {
  let scene = new Scene();

  let score = 0; // 現在のスコア
  let count = 0; // 作ったサークルの個数
  let highScore = new Array(HIGH_SCORE_LENGTH); // ハイスコア

  //背景
  let back = new Sprite(320, 480);
  back.backgroundColor = backgroundColor;
  scene.addChild(back);

  //グループ
  let changeGroup = new Group();
  scene.addChild(changeGroup);
  let circleGroup = new Group();
  scene.addChild(circleGroup);
  let myCircleGroup = new Group();
  scene.addChild(myCircleGroup);

  //スコア
  let scoreLabel = new Label(`SCORE ${score}`);
  scoreLabel.color = "white";
  scoreLabel.font = "24px 'PixelMplus10'";
  scene.addChild(scoreLabel);

  //チェンジボタン
  for (let i = 0; i < ROWS; i++) {
    let changeButton = new Sprite(64, 64);
    changeButton.x = 64 * i;
    changeButton.y = core.height - changeButton.height;
    changeButton.image = core.assets["images/CHANGE.png"];
    changeButton.mode = "black";
    changeGroup.addChild(changeButton);

    //チェンジボタンのイベント
    changeButton.addEventListener(Event.TOUCH_START, function() {
      change(i);
    });
  }

  // 落ちてくるサークルと当たる部分
  for (let i = 0; i < ROWS; i++) {
    let myCircle = new Sprite(64, 64);
    myCircle.image = core.assets["images/circle.png"];
    myCircle.x = 64 * i;
    myCircle.y = core.height - 128;
    myCircle.frame = 0;
    myCircle.mode = "black";
    myCircleGroup.addChild(myCircle);

    //衝突判定
    myCircle.addCollision(circleGroup);
    myCircle.addEventListener(Event.COLLISION, function(e) {
      if (e.collision.target.mode == myCircle.mode) {
        e.collision.target.remove();
        score += 1;
        scoreLabel.text = `SCORE ${score}`;
      } else {
        // 違う色とぶつかった場合はゲームオーバー
        gameOver();
      }
    });
  }

  // サークルを落とし始める
  fallStart();

  //========================================================
  //        以下は関数群
  //========================================================

  /**
   * n番目のマイサークルをチェンジする
   * @param  {Number} n チェンジする要素の番号
   */
  function change(n) {
    let change = changeGroup.childNodes[n];
    if (change.mode == "white") {
      change.mode = "black";
      myCircleGroup.childNodes[n].frame = 0;
      myCircleGroup.childNodes[n].mode = "black";
    } else if (change.mode == "black") {
      change.mode = "white";
      myCircleGroup.childNodes[n].frame = 1;
      myCircleGroup.childNodes[n].mode = "white";
    }
  }

  /**
  * サークルを落とす
  */
  function fallStart() {
    // levelの更新
    let level = Math.floor(count / 5);
    let delayLevel = Math.min(16, level); // 16が最大
    let speedLevel = Math.min(32, level); // 32が最大
    // Timeの計算
    let delayTime = 16 - delayLevel + getRandom(0, 32); // 0 ~ 48
    let moveTime = 48 - speedLevel; // 16 ~ 48
    // サークルを作る
    let circle = new Circle(moveTime);
    circleGroup.addChild(circle);
    count++;

    circleGroup.tl.delay(delayTime);
    circleGroup.tl.then(function() {
      // 再帰的に呼び出す
      fallStart();
    });
  }

  /**
   * サークルグループの全てを停止する
   */
  function circleGroupStop() {
    let length = circleGroup.childNodes.length;

    circleGroup.tl.clear();
    for (let i = 0; i < length; i++) {
      circleGroup.childNodes[i].tl.clear();
    }
  }

  /**
  * localStorageからハイスコアを読み込む
  * 数字を読み込めなかった場合は0を初期値にする
  */
  function loadHighScore() {
    let array = JSON.parse(localStorage.getItem(HIGH_SCORE_KEY));
    for (let i = 0; i < highScore.length; i++) {
      // 数字なら読み込んだ値を入れ、数字以外なら0を入れる
      if (typeof(array[i]) == "number") {
        highScore[i] = array[i];
      } else {
        highScore[i] = 0;
      }
    }
  }

  /**
  * localStorageにハイスコアを保存する
  */
  function saveHighScore() {
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScore));
  }

  /**
  * 新しいスコアを加味してハイスコアの更新をする
  * スコアと同じ値だった場合は、スコアがより上の方に来るようにする
  * @return {Number} スコアがどこに入ったかのインデックス番号
  */
  function updateHighScore() {
    let index = highScore.length - 1;

    loadHighScore();

    // ハイスコアにランクインしなかったら終了
    if (score < highScore[index]) {
      return -1;
    }

    highScore[index] = score;

    // 下位から評価していき、更新しなくなったら抜ける
    while (index > 0) {
      // 同じ値の場合も更新する
      if (highScore[index - 1] <= highScore[index]) {
        let work = highScore[index - 1];
        highScore[index - 1] = highScore[index];
        highScore[index] = work;
      } else {
        break;
      }
      index--;
    }

    saveHighScore();

    return index;
  }

  /**
   * ハイスコアを表示する
   */
  function showHighScore() {
    // ハイスコアの更新
    let index = updateHighScore();

    for (let i = 0; i < highScore.length; i++) {
      let pointLabel = makeLabel(
        `${i + 1}.${highScore[i]}`,
        0,
        128 + i * 32,
        "white",
        24,
        "center",
        scene
      );
      pointLabel.textAlign = "center";

      // 新しく入ったスコアの場所と同じだった場合
      if (i == index) {
        pointLabel.tl.fadeTo(0, 16);
        pointLabel.tl.fadeTo(1, 16);
        pointLabel.tl.loop();
      }
    }
  }

  /**
   * ゲームオーバーの処理をする
   */
  function gameOver() {
    circleGroupStop();
    showHighScore();

    // ハイスコアを見るために、少し待ってからタイトルに戻る
    scene.tl.delay(16 * 5);
    scene.tl.then(function() {
      core.replaceScene(titleSceneStart());
    });
  }

  return scene;
}

/**
 * タイトルのシーンを開始する
 * @return {enchant.Scene} 開始したシーン
 */
function titleSceneStart() {
  let scene = new Scene();

  // タッチしたら始まる部分をまとめるためのグループ
  let touchToStartGroup = new Group();
  scene.addChild(touchToStartGroup);
  touchToStartGroup.addEventListener(Event.TOUCH_START, function() {
    core.replaceScene(gameSceneStart());
  });

  let background = new Sprite(320, 480);
  background.backgroundColor = backgroundColor;
  touchToStartGroup.addChild(background);

  // タイトル
  let whiteLabel = makeLabel("WHITE", -320 / 4, 480 / 3 - 50, "white", 32, "center", touchToStartGroup);
  let orLabel = makeLabel("OR", 0, 480 / 3, "gray", 32, "center", touchToStartGroup);
  let blackLabel = makeLabel("BLACK", 320 / 4, 480 / 3 + 50, "black", 32, "center", touchToStartGroup);

  let startLabel = makeLabel("TOUCH TO START", 0, 480 * 3 / 4, "white", 32, "center", touchToStartGroup);
  startLabel.tl.fadeTo(0, 16);
  startLabel.tl.fadeTo(1, 16);
  startLabel.tl.loop();

  let backColor = makeLabel("backColor", 0, 0, "white", 20, "right", scene);
  backColor.addEventListener(Event.TOUCH_START, function() {
    core.replaceScene(backColorEditSceneStart());
  });

  return scene;
}

/**
 * 背景色変更画面のシーンを開始する
 * @return {enchant.Scene} 開始したシーン
 */
function backColorEditSceneStart() {
  let scene = new Scene();

  let background = new Sprite(320, 480);
  background.backgroundColor = backgroundColor;
  scene.addChild(background);

  let colorLabelGroup = new Group();
  scene.addChild(colorLabelGroup);

  makeLabel("backColor", 0, 30, "black", 30, "center", scene);
  let titleLabel = makeLabel("title", 0, 0, "white", 20, "left", scene);
  titleLabel.addEventListener(Event.TOUCH_START, function() {
    core.replaceScene(titleSceneStart());
  });

  // 色のラベル
  for (let i = 0; i < colors.length; i++) {
    let colorLabel = makeLabel(colors[i], 50, 100 + i * 50, "silver", 30, "left", colorLabelGroup);
    setColor();

    colorLabel.addEventListener(Event.TOUCH_START, function() {
      backgroundColor = colorLabel.text;
      background.backgroundColor = backgroundColor;
      setColor();
    });
  }

  /**
   * colorLabelGroupの要素の色をセットする
   * 背景色と同じなら白、違うのならシルバーにセットする
   */
  function setColor() {
    for (let i = 0; i < colorLabelGroup.childNodes.length; i++) {
      if (colorLabelGroup.childNodes[i].text == backgroundColor) {
        colorLabelGroup.childNodes[i].color = "white";
      } else {
        colorLabelGroup.childNodes[i].color = "silver";
      }
    }
  }

  return scene;
}

/**
 * Labelを作って返す
 * @param  {String} text  ラベルのテキスト
 * @param  {Number} x     x座標
 * @param  {Number} y     y座標
 * @param  {String} color 色
 * @param  {String} font  フォント
 * @param  {String} textAlign 水平方向の指定
 * @param  {enchant.Group} scene addChildする対象
 * @return {enchant.Label}       作ったラベル
 */
function makeLabel(text, x, y, color, fontsize, textAlign, scene) {
  let label = new Label(text);
  label.x = x;
  label.y = y;
  label.color = color;
  label.font = `${fontsize}px 'PixelMplus10'`;
  label.textAlign = textAlign;
  label.width = 320;
  scene.addChild(label);

  return label;
}

//==========
//EnchantJS
enchant();
let gameManager;
let core;
gameManager = new common.GameManager();
window.onload = function() {
  core = gameManager.createCore(320, 480);
  core.preload(assets);
  core.onload = function() {
    core.resume();
    core.replaceScene(titleSceneStart());
  };
  core.start();
  core.pause();
};
