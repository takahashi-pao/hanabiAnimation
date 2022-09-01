//---------------------------------------------------------------------------------------------
// 全体的な処理の流れ
//---------------------------------------------------------------------------------------------
// ①mainLoopが60fpsで処理され続ける
// ②着火イベントが発生
// ③updateEveryFrame→updateObj(hanabi)→updateObj(afterImage)が処理される
// ④drawEveryFrame→drawObj(afterImage)→drawObj(hanabi)が処理される

//---------------------------------------------------------------------------------------------
// funtionごとの処理の流れ
//---------------------------------------------------------------------------------------------
// Hanabi.updateメソッド
// 1. 爆発フラグがOFF（＝0）のとき
//		・打ち上げ中の花火、残像共通のx, y座標とy軸方向の移動量（vy）の更新
// 2. 爆発フラグがOFF（=0）かつy軸方向の移動量（vy）が0 = 打ち上げた粒子の速度が0になった場合
//		・打ち上げた粒子を削除
//		・爆発し飛び散る粒子を個別にパラメータを設定し、hanabi配列に300個格納
// 3. 爆発フラグがON（＝1）のとき
//		・粒子のhpと残像制御用のspをデクリメントし、フェードアウト処理を行う
//		・hpが0になるとキルフラグをONにし、粒子を削除する

// AfterImage.updateメソッド
// ・ キルフラグがONのオブジェクトの場合は何もしない
// ・カウンターパラメータをデクリメントする

// AfterImage.drawメソッド
// ・キルフラグがONのオブジェクトの場合は何もしない
// ・AfterImage.updateメソッドにおいてデクリメントされるカウンターを利用し、粒子の透明度を10段階で上げる
// ・残像色をHanabi.drawメソッドにおける引数で設定する
// ・残像粒子を描画する

// Hanabi.drawメソッド
// ・粒子の描画設定で点滅させ、キラキラしているような設定をする
// ・キルフラグがONの場合は何もしない
// ・オリジナルの花火粒子と、透明度を抑えた粒子（2パターン）を描画する
// ・hpにより、透明度を操作する
// ・afterImage配列にAfterImageクラスオブジェクトを格納する

// ----------------------
// 座標に関するtips
// ----------------------
// ● HTML: 200x100
// 　＜canvas width="200" height="100" id="canvas" ＞＜/canvas＞
// ● 座標系
// 　左上が原点(0,0)、右下が(200,100)
// 　X軸方向のピクセル（画素）番号は 0～199
// 　Y軸方向のピクセル（画素）番号は 0～ 99
// 　左上のピクセルの中央は（0.5, 0.5）

// ---------------------------
// シフト演算に関するtips
// ---------------------------
// 残像（描画）のクオリティを上げるために行っている
// 左8ビットシフトで256倍（2の8乗）、右8ビットシフトで1/256倍

// キャンバス設定
let canvas = document.getElementById("can");
let con = canvas.getContext("2d");

// キャンバスサイズ設定
const CANVAS_SIZE_W = 800;
const CANVAS_SIZE_H = 600;
canvas.width  = CANVAS_SIZE_W;
canvas.height = CANVAS_SIZE_H;

// 粒子制御のための配列
let hanabi=[];
let afterImage =[];
// let xPosition;

// 色のプロパティ
let fwcol = [
    "#ffdd55",
    "#ff6622",
    "#2255ff",
    "#44ff44",
];

/**
 * ランダムな値を生成する関数
 * @param {*} min 乱数生成における最小値
 * @param {*} max 乱数生成における最大値
 * @returns 規定値範囲内のランダムな整数
 */
 function rand(min,max)
 {
     return Math.floor(Math.random()*(max-min+1))+min;
 }

 /**
 * 着火関数
 * キーボードが押された時に呼ばれる
 * @param {*} e イベントオブジェクト
 */
document.onkeydown = function(e)
{
	// １，２，３、Shiftキーのどれかが押下されると実行
	if(e.key == 1 ||
		e.key == 2 ||
		e.key == 3 ||
		e.shiftKey == true
	)
	{
        // 打ち上げの場所をある程度決める
		let s;
		if(e.key == 1)s=0;
		if(e.key==2)s=250;
		if(e.key==3)s=520;
		
        // 押下されたキーにより画面をおよそ3分割したx（横座標）が決定
		let x=rand(s,s+250);
        // Shiftのときは完全ランダムなx座標が決定
		if( e.shiftKey == true )x=rand(0,CANVAS_SIZE_W);
        // y座標は画面最下部から50pxほどの間で決定
		let y=rand(CANVAS_SIZE_H-50,CANVAS_SIZE_H);
        // 花火の配列に上記で設定した花火クラスのオブジェクトを末尾に新規追加
		// <<8はビット演算子の都合上
		// ここで設定された3つ目の引数「ca」はHanabi.drawメソッドで書き換えるのでダミー
		// tp, hpはインスタンス化の際に設定されるので引数に渡す必要はない        
		hanabi.push(
				new Hanabi( x<<8,y<<8, 0, 0,-800,4) 
			);
	}
}

//---------------------------------------------------------------------------------------------
// 花火（粒子）の動作制御を目的とした処理
//---------------------------------------------------------------------------------------------

// 粒子の描画頻度（フレームレート）
// 着火に関わらずインターバルは実行されている
setInterval(mainLoop,1000/60);

/**
 * 実行されるメソッドはフレーム毎の更新、描画メソッド
 * 上記インターバル（周期）でループする（現在は60fpsで設定）
 */
function mainLoop()
{
	updateEveryFrame();
	drawEveryFrame();
}

/**
 * フレーム毎の更新処理
 */
function updateEveryFrame()
{
    //着火キーが押下されるまではlengthが0なので実行されない
	updateObj(hanabi);
	updateObj(afterImage);
}

/**
 * フレーム毎の描画
 */
function drawEveryFrame()
{
	// //画面を黒でクリア
	con.globalCompositeOperation = 'source-over';
	con.fillStyle="#000000";
	con.fillRect(0,0,CANVAS_SIZE_W,CANVAS_SIZE_H);
    //// 透明な背景
    // con.clearRect(0, 0, CANVAS_SIZE_W, CANVAS_SIZE_H);
	
    // // 花火と残像の配列格納数を表示(調査用)
	// con.fillStyle="#ffffff";
	// con.fillText("H:"+hanabi.length,10,10);
	// con.fillText("Z:"+afterImage.length,10,30);
	// con.fillText("x:"+ xPosition, 10, 50);
	
	con.globalCompositeOperation = 'lighter';

    // 着火キーが押下されるまではいずれの配列もlengthが0なので実行されない
	drawObj(afterImage);
	drawObj(hanabi);
}

/**
 * 配列に格納されたクラスオブジェクトを更新
 * @param {any} obj 更新を行うクラスオブジェクトが格納された配列
 */ 
function updateObj(obj)
{
	//配列内に格納されたクラスオブジェクトを更新
    //配列内に格納されたクラスのメソッド（update）を実行
	for(let i=obj.length-1;i>=0;i--)
	{
		// ----------------------------
		// Hanabi.updateに関して
		// ----------------------------
		// 1. 打ち上げ中（hanabi.lemgth = 1）
		//		・着火タイミングで配列にpushされた粒子が爆発条件に適合するまでパラメータが更新される
		// 2. 爆発時（hanabi.length = 300）
		//		・爆発粒子が設定されるだけ
		// 3. 爆発後（0<= hanabi.length <= 300）
		//		・粒子ごとにパラメータを更新
		//		・キルフラグがONになった粒子から削除する

		// ----------------------------
		// AfterImage.updateに関して
		// ----------------------------
        // 残像のキルフラグの管理を行う

		obj[i].update();
		if( obj[i].kill )obj.splice(i,1);
	}
}

/**
 * 配列に格納されたクラスオブジェクトを描画
 * @param {any} obj 描画を行うクラスオブジェクトが格納された配列
 */ 
 function drawObj(obj) {
    //配列内に格納されたクラスオブジェクトを描画
    //配列内に格納されたクラスのメソッド（draw）を実行
    for (let i = obj.length - 1; i >= 0; i--) {
        obj[i].draw();
    }
}

//---------------------------------------------------------------------------------------------
// 花火（粒子）のパラメータ制御を目的とした処理
//---------------------------------------------------------------------------------------------
    /**
     * 残像クラス
     */
    class AfterImage
    {
        // コンストラクター
        // 座標（x, y）、色情報（col）、キルフラグ、カウンター
        constructor(x,y,col)
        {
            this.col=col;
            this.x=x;
            this.y=y;
            this.counter =10;
            this.kill=false;
        }
        
        // 残像クラス限定の更新メソッド
        update()
        {
            // キルフラグがONなら何もしない
            if(this.kill)return;
            // 実行の度、カウンターをインクリメントし０（＝残像粒子が透明）になったらキルフラグをONにする
            if(--this.counter==0)this.kill=true;
        }
        
        // 残像クラス限定の描画メソッド
        draw()
        {
            // キルフラグがONなら何もしない
            if(this.kill)return;
            
            // カウンターのデクリメントを利用して徐々に薄くなる
            con.globalAlpha=1.0 * this.counter /10;
            // 花火色を引数cにより決める（打ち上げ中（tp == 0）は確定で黄色　ex.)Hanabi.draw参照)
            con.fillStyle=fwcol[this.col];
            // 花火を引数のx, y座標に2×2pxで描画する
            con.fillRect((this.x>>8),(this.y>>8),2,2);
            
        }
    }
    
    /**
     * 花火本体＝爆発クラス
     */
    class Hanabi
    {
        // コンストラクター
        // 座標（x, y）、色情報（ca）、移動量（vx, vy）、キルフラグ、重力（gv）、tp（打ち上げ中（=0）判定）、hp（粒子の削除判定）、sp（残像のフェードアウト制御パラメータ）
        constructor(x,y,ca,vx,vy,gv,tp,hp)
        {
            this.col=ca;
            this.x=x;
            this.y=y;
            this.vx=vx;
            this.vy=vy;
            this.kill=false;
			// 着火時、爆発時に設定される重力…vyに加算されていく固定値＝y軸移動量が漸次減少する
            this.gv = gv;
            // 爆発時再設定される
            if(tp==undefined)tp=0;
            this.tp=tp;
			// ここで設定されるhpは爆発条件の粒子設定の際に再設定されるのでダミー
            if(hp==undefined)hp=100;
			// 爆発時に引数として渡されるhpを設定
            this.hp=hp;
			// spの設定はここだけ
            this.sp=100;
        }
        
        // 花火クラス限定の更新メソッド
        // 3段階の処理が行われる
        update() {
            // -------------------------------------------------------------------------------
            // ①必ず処理される内容
            // -------------------------------------------------------------------------------
            // キルフラグがONなら何もしない
            if (this.kill) return;
            // x, y座標の決定
            // spは漸次減少するのでx, yは減り続ける → 爆発点を中心に広がる＋広がるにつれ1フレームごとの移動量が減る
            this.x += this.vx * this.sp / 100;
            this.y += this.vy * this.sp / 100;
            // 重力の決定
            // 漸次遅くなる
            this.vy += this.gv;

            

            // 画面からはみ出たらキルフラグをON＝何もしない
            if (this.x >> 8 < 0 || this.x >> 8 > CANVAS_SIZE_W ||
                this.y >> 8 > CANVAS_SIZE_H) this.kill = true;


            // -------------------------------------------------------------------------------------------
            // ②爆発条件（tp == 0 && this.vy >= 0）を満たした場合に1度だけ処理される内容
            // -------------------------------------------------------------------------------------------			
            // 打ち上げ中　かつ　移動量(vy)が0以上＝下方向への移動をする瞬間
            // つまり速度=0になった場合、爆発する			
            if (this.tp === 0 && this.vy >= 0) {
                // 打ち上げた花火の種を消す
                this.kill = true;

                // 内側の粒子を生成
                for (let i = 0; i < 200; i++) {
                    // 角度の設定
                    let r = rand(0, 360);
                    // 速度の設定 => 内側の粒子の最高速が最低速 = グラデーションの発生
                    // （実質的な移動量の設定）
                    let s = rand(10, 300);
                    // |min| <= x移動量、y移動量 <= |max|となり、爆発点を中心とした{min}pxの円弧以内で消える粒子は生成されない
                    // x移動量（総量）の設定
                    let vx = Math.cos(r * Math.PI / 180) * s;
                    // y移動量（総量）の設定
                    let vy = Math.sin(r * Math.PI / 180) * s;
                    // 打ち上げ後判定（tp=1）とhp（{hp}フレーム生存）を設定してhanabi配列末尾に設定
                    hanabi.push(
                        new Hanabi(this.x, this.y, this.col, vx, vy, 1, 1, 200)
                    );
                }

                // 外側の粒子色の設定
                let col = rand(0, 3);
                // 外側の粒子を生成
                for (let i = 0; i < 100; i++) {
                    // 角度の設定
                    let r = rand(0, 360);
                    // 速度の設定 => 内側の粒子の最高速が最低速 = グラデーションの発生
                    // （実質的な移動量の設定）
                    let s = rand(300, 400);
                    // x移動量（総量）の設定
                    let vx = Math.cos(r * Math.PI / 180) * s;
                    // y移動量（総量）の設定
                    let vy = Math.sin(r * Math.PI / 180) * s;
                    // 打ち上げ後判定（tp=1）とhp（{hp}フレーム生存）を設定してhanabi配列末尾に設定
                    hanabi.push(
                        new Hanabi(this.x, this.y, col, vx, vy, 1, 1, 200)
                    );
                }

            }
            // ------------------------------------------------------------------------------------
            // ③爆発後、必ず処理される内容
            // ------------------------------------------------------------------------------------
            if (this.tp === 1) {
                // 打ち上げたらhp(粒子ごとに設定)をデクリメント
                this.hp--;
                if (this.hp < 100) {
                    // hp<100になるとspもデクリメント
                    // spが減ると1フレームごとの粒子の移動量が減る（減速）
                    if (this.sp) this.sp--;
                }
                // hp==0になるとその粒子を削除（速度も0になっている）
                if (this.hp === 0) this.kill = true;
            }
        }
        
        // 花火クラス限定の描画メソッド
        // 粒子（オリジナル）、エフェクト用粒子（2種類）の描画をメイン処理とする　
        draw()
        {
            // キラキラ設定（点滅を用いて表現）
            // tp>0（＝爆発中）のとき、80%の確率で何もしない
            if(this.tp>0 && rand(0,100)<80 )return;
            // tp==0（打ち上げ中）のとき、20%の確率で何もしない
            if(this.tp==0 && rand(0,100)<20 )return;

            // キルフラグがONなら何もしない
            if(this.kill)return;
            
            // くっきり
            con.globalAlpha=1.0;
            // hp<50なら次第に薄く（hp依存）する
            if(this.hp<50)con.globalAlpha=this.hp/50;
            // 色情報の設定
            let col=this.col;
            // tp==0（＝打ち上げ中）なら確定で黄色にする
            if(this.tp==0)col=0;
            // 粒子の色
            con.fillStyle=fwcol[col];
            // 残像粒子の大きさを3パターン設定
            // ①透明度1から徐々に減る粒子(オリジナル)
            con.fillRect(this.x>>8,this.y>>8,2,2);

            // 透明度0.5の粒子
            con.globalAlpha=0.5;
            // ②横に少しだけずらして横に少しだけ大きい粒子
            con.fillRect((this.x>>8)-1,(this.y>>8),4,2);
            // ③縦に少しだけずらして縦に少しだけ大きい粒子
            con.fillRect((this.x>>8),(this.y>>8)-1,2,4);
            // 残像配列末尾に追加
			// spがループごとに減少するので残像の1フレームごとの移動量が減り続ける＝速度が落ちるような表現
            afterImage.push(
                new AfterImage( this.x,this.y,col) 
            );
            // 検証用
			// xPosition = this.x;
        }
    }
    
