// --- VARIABEL GLOBAL ---
let possibleCodes = [];
let aiRunning = false;

// Memasukan semua kombinasi angka 0-9999
function generateAllCodes() {
    let codes = [];
    for (let i = 0; i < 10000; i++) {

        codes.push(String(i).padStart(4, "0"));
    }
    return codes;
}

// 1. LOGIKA INTI (BACKEND LOGIC) 
function getFeedback(secret, guess) {
    let result = ["tomato", "tomato", "tomato", "tomato"];
    let secretCounts = {};
    // kunci: 1155
    // tebakan: 1122

    for (let char of secret) {
        secretCounts[char] = (secretCounts[char] || 0) + 1;
    }


    for (let i = 0; i < 4; i++) {
        if (guess[i] === secret[i]) {
            result[i] = "lightgreen";
            secretCounts[guess[i]]--;
        }
    }

  
    for (let i = 0; i < 4; i++) {
        if (result[i] === "lightgreen") continue;

        let char = guess[i];
        if (secretCounts[char] > 0) {
            result[i] = "yellow";
            secretCounts[char]--;
        }
    }

    return result;
}

// Menghapus kode yang tidak mungkin dari daftar (Pruning)
function pruneCodes(candidates, lastGuess, lastFeedback) {
    return candidates.filter((code) => {

        let simFeedback = getFeedback(code, lastGuess);
        return JSON.stringify(simFeedback) === JSON.stringify(lastFeedback);
    });
}

// Mencari tebakan yang meminimalkan sisa kemungkinan terburuk
function getMinimaxGuess(candidates) {
    // kalau sisa kandidat 2, return yang kiri
    if (candidates.length <= 2) return candidates[0];

    // inisialisasi best guess
    let bestGuess = candidates[0];
    // penetapan worst case (harus angka yang besar = infinity di js)
    let minWorstCase = Infinity;
    // search space agar tidak nge lag
    let searchSpace =
        candidates.length > 500 ? candidates.slice(0, 500) : candidates;


    // fungsi minimax
    for (let guess of searchSpace) {
        let scores = {};

        // menghitung sisa kemungkinan
        // {"['tomato', 'tomato', 'tomato', 'tomato']": 900}
        for (let solution of candidates) {
            let feedback = JSON.stringify(getFeedback(solution, guess));
            scores[feedback] = (scores[feedback] || 0) + 1;
        }

        // menghitung max atau worst case
        let maxSisa = 0;
        for (let key in scores) {
            if (scores[key] > maxSisa) {
                maxSisa = scores[key];
            }
        }

        // menghitung min worst case
        if (maxSisa < minWorstCase) {
            minWorstCase = maxSisa;
            bestGuess = guess;
        }
    }

    return bestGuess;
}

// fungsi tampilan ke html
function renderRow(guess, colors) {
    let div = document.createElement("div");
    div.className = "row";

    for (let i = 0; i < 4; i++) {
        let p = document.createElement("div");
        p.className = "box";
        p.textContent = guess[i];
        p.style.backgroundColor = colors[i];


        if (colors[i] === "tomato") p.style.color = "white";
        else p.style.color = "black";

        div.appendChild(p);
    }
    document.getElementById("jawaban").appendChild(div);
    window.scrollTo(0, document.body.scrollHeight);
}

// Fungsi jika ingin bermain manual
function handleManualGuess() {
    if (aiRunning) return;

    let tebakan = document.getElementById("guess");
    let tombol = document.querySelector("#manualSection button");
    let kunci = document.getElementById("kunci").value;

    if (!/^\d{4}$/.test(tebakan.value) || !/^\d{4}$/.test(kunci)) {
        return alert("Pastikan kunci dan tebakan 4 digit angka!");
    }

    let colors = getFeedback(kunci, tebakan.value);
    renderRow(tebakan.value, colors);

    // cek menang
    if (colors.every(c => c === "lightgreen")) {
        document.getElementById("pesanMenang").textContent =
            "🎉 SELAMAT! Kamu berhasil menebak kunci dengan benar!";
        
        tebakan.disabled = true;
        tombol.disabled = true;
        tombol.textContent = "✔ Selesai";
    }
}

// fungsi main
async function startSimulation() {
    
    if (aiRunning) return;

    aiRunning = true;
    document.getElementById("guess").disabled = true;
    document.querySelector("#manualSection button").disabled = true;

    // ambil kunci dari textfield html
    let kunci = document.getElementById("kunci").value;
    // validasi kunci
    if (kunci.length !== 4) {
        aiRunning = false;
        document.getElementById("guess").disabled = false;
        document.querySelector("#manualSection button").disabled = false;
        return alert("Isi kunci jawaban dulu!");
    }

    // reset jika ada jawaban
    resetGame();

    // info loading
    document.getElementById("statusPermainan").textContent = "Loading...";

    // generate semua kemungkinan
    possibleCodes = generateAllCodes();

    // mendefiinisikan tebakan awal
    let currentGuess = "1122";
    // menghitung langkah
    let attempts = 0;
    // status permainan
    let solved = false;

    // logika utama permainan
    while (!solved && possibleCodes.length > 0) {
        // tambah langkah karena sudah mulai
        attempts++;

        // info permainan
        document.getElementById("statusPermainan").textContent =
            `Langkah ke-${attempts}: Komputer menebak ${currentGuess} (Sisa kemungkinan: ${possibleCodes.length})`;

        // hitung feedback tebakan dan tampilkan hasilnya
        let colors = getFeedback(kunci, currentGuess);
        renderRow(currentGuess, colors);

        // mengecek jika semua angka sudah benar
        if (colors.every((c) => c === "lightgreen")) {
            document.getElementById("statusPermainan").textContent =
                `Komputer Menang dalam ${attempts} langkah!`;
            solved = true;
            break;
        }

        // loading biar gk nge lag
        await new Promise((r) => setTimeout(r, 800));

        //  fungsi pruning
        possibleCodes = pruneCodes(possibleCodes, currentGuess, colors);

        // fungsi minimax
        if (possibleCodes.length > 0) {
            currentGuess = getMinimaxGuess(possibleCodes);
        } else {
            document.getElementById("statusPermainan").textContent =
                "Komputer Menyerah (Logika Error/Kunci tidak valid)";
        }
    }
    aiRunning = false;
    document.getElementById("guess").disabled = false;
    document.querySelector("#manualSection button").disabled = false;
}

// Fungsi Ganti Mode
function setMode(mode) {
    if (aiRunning) return;
    resetGame();
    const manual = document.getElementById("manualSection");
    const ai = document.getElementById("aiSection");
    const btnManual = document.getElementById("btnManual");
    const btnAI = document.getElementById("btnAI");

    if (mode === "manual") {
        manual.style.display = "block";
        ai.style.display = "none";
        btnManual.classList.add("active");
        btnAI.classList.remove("active");
    } else {
        manual.style.display = "none";
        ai.style.display = "block";
        btnAI.classList.add("active");
        btnManual.classList.remove("active");
    }
}

// Fungsi Reset Riwayat
function resetGame() {
    document.getElementById("jawaban").innerHTML = "";
    document.getElementById("pesanMenang").textContent = "";
    document.getElementById("statusPermainan").textContent = "";

    const tebakan = document.getElementById("guess");
    const tombol = document.querySelector("#manualSection button");

    tebakan.disabled = false;
    tombol.disabled = false;
    tombol.textContent = "Cek";

    tebakan.value = "";

    possibleCodes = [];
}