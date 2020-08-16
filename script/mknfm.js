let ctx = null;

let osc = [null, null];	// オシレータ
let amp = [null, null, null];	// アンプ

let stats;

let TimerID;

function NoteON(freq, param) {
	let [Algo,
		O1x, O1t,	// OSC: 回転倍率、波形
		A1v, A1a, A1t, A1d, A1s,	// EG: アタック音量、アタック時間、ディケイ時間、サスティン音量、サスティン増幅量
		O2x, O2t,
		A2v, A2a, A2t, A2d, A2s,
		Afv, Afa, Aft, Afd, Afs,
	] = param;
	let AtcSpd = [A1v / A1a, A2v / A2a, Afv / Afa];	// アタック増幅量
	let DcySpd = [(A1d - A1v) / A1t, (A2d - A2v) / A2t, (Afd - Afv) / Aft];	// ディケイ増幅量

	// アルゴリズムの組み立て
	osc[0] = ctx.createOscillator();
	osc[0].frequency.value = freq * O1x;
	osc[0].type = ['sine', 'square', 'sawtooth', 'triangle'][O1t];
	osc[1] = ctx.createOscillator();
	osc[1].frequency.value = freq * O2x;
	osc[1].type = ['sine', 'square', 'sawtooth', 'triangle'][O2t];

	amp[0] = ctx.createGain();
	amp[1] = ctx.createGain();
	amp[2] = ctx.createGain();

	switch (Algo) {
		case 1:
			osc[1].connect(amp[1]);
			osc[1].connect(amp[2]);
			amp[1].connect(osc[0].frequency);
			osc[0].connect(amp[0]);
			amp[0].connect(ctx.destination);
			amp[2].connect(osc[1].frequency);
			break;
		case 2:
			osc[1].connect(amp[1]);
			amp[1].connect(osc[0].frequency);
			osc[0].connect(amp[0]);
			osc[0].connect(amp[2]);
			amp[0].connect(ctx.destination);
			amp[2].connect(osc[1].frequency);
			break;
		case 3:
			osc[1].connect(amp[1]);
			amp[1].connect(osc[0].frequency);
			osc[0].connect(amp[0]);
			osc[0].connect(amp[2]);
			amp[0].connect(ctx.destination);
			amp[2].connect(osc[0].frequency);
			break;
		case 4:
			osc[1].connect(amp[1]);
			osc[1].connect(amp[2]);
			amp[1].connect(ctx.destination);
			amp[2].connect(osc[1].frequency);
			osc[0].connect(amp[0]);
			amp[0].connect(ctx.destination);
			break;
		default:
	}

	let OnTime = window.performance.now();
	osc[0].start(); osc[1].start();
	TimerID = setInterval(function () {
		let dt = window.performance.now() - OnTime;	// 経過時間

		// アンプ 1
		if (dt <= A1a) {	// アタック時間
			amp[0].gain.value = dt * AtcSpd[0];
		}
		else if (dt <= A1a + A1t) {	// ディケイ時間
			amp[0].gain.value = A1v + (dt - A1a) * DcySpd[0];
		}
		else {	// リリース時間
			amp[0].gain.value = A1d + (dt - (A1a + A1t)) * A1s;
		}
		amp[0].gain.value < 0 && (amp[0].gain.value = 0);

		// アンプ 2
		if (dt <= A2a) {	// アタック時間
			amp[1].gain.value = dt * AtcSpd[1];
		}
		else if (dt <= A2a + A2t) {	// ディケイ時間
			amp[1].gain.value = A2v + (dt - A2a) * DcySpd[1];
		}
		else {	// リリース時間
			amp[1].gain.value = A2d + (dt - (A2a + A2t)) * A2s;
		}
		amp[1].gain.value < 0 && (amp[1].gain.value = 0);

		// アンプ 1
		if (dt <= Afa) {	// アタック時間
			amp[2].gain.value = dt * AtcSpd[2];
		}
		else if (dt <= Afa + Aft) {	// ディケイ時間
			amp[2].gain.value = Afv + (dt - Afa) * DcySpd[2];
		}
		else {	// リリース時間
			amp[2].gain.value = Afd + (dt - (Afa + Aft)) * Afs;
		}
		amp[2].gain.value < 0 && (amp[2].gain.value = 0);

		stats.textContent = `TIME: ${dt}\nAMP1: ${amp[0].gain.value}\nAMP2: ${amp[1].gain.value}\nAMPf: ${amp[2].gain.value}`;
	});
}

function NoteOFF() {
	clearTimeout(TimerID);
	osc[0].stop();
	osc[1].stop();
}

window.addEventListener('load', () => {
	stats = document.getElementById('stats');
	stats.textContent = 'OK';
	document.getElementById('TRIG').addEventListener('mousedown', () => {
		if (!ctx) {
			ctx = new AudioContext();
		}
		let param = document.getElementById('SND').value.split(',');
		for (let i = 0; i < param.length; i++) {
			param[i] = +param[i];
		}
		NoteON(+document.getElementById('FREQ').value, param);
	});
	document.getElementById('TRIG').addEventListener('mouseup', () => NoteOFF());
});	
