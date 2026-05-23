// Meet Summarizer

const state = {
    transcript: [],      // Save the transcript to this array
    lastBlock: null,
    offset: 0,
    currentSpeaker: "",
    timeout: null,
    observer: null
};

// Find related HTML fields to save them into array
// DOM scraping is used here, it can be improved to be more robust regarding UI updates
const SELECTORS = {
    block: '.nMcdL.bj4p3b, [jscontroller="D1mThb"]', 
    text: '.ygicle.VbkSUe',
    name: '.NWpY1d'
};

// Get the time stamp and API key

const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

async function getApiKey() {
    const data = await chrome.storage.local.get("gemini_api_key");     // API key is stored locally and not sent to any server
    if (data.gemini_api_key) return data.gemini_api_key;
    
    const userKey = window.prompt("Gemini API Anahtarı bulunamadı. Lütfen girin:");
    if (userKey) {
        await chrome.storage.local.set({ "gemini_api_key": userKey });
        return userKey;
    }
    return null;
}

// Actions

const downloadTranscript = () => {
    if (state.transcript.length === 0) return alert("Transkript henüz boş!");
    
    const content = `Toplantı Tarihi: ${new Date().toLocaleDateString('tr-TR')}\n` + 
                    `-----------------------------------\n` + 
                    state.transcript.join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meet_Dokumu_${new Date().toISOString().slice(0,10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
};

async function generateAISummary() {
    const apiKey = await getApiKey();
    if (!apiKey || state.transcript.length === 0) return;

    const fullText = state.transcript.join('\n');     // Join the strings in transcript array to get the full text
    
    const prompt = `Sen profesyonel bir sekretersin. Aşağıdaki toplantı dökümünü Türkçe olarak özetle. Markdown formatı (**, ##, __ gibi işaretler) kullanma.
    Lütfen şu yapıyı kullan:
    1. Ana Konular: Konuşulan temel başlıklar.
    2. Önemli Kararlar: Alınan kesin kararlar.
    3. Aksiyon Maddeleri: Hangi somut adımların atılmasına karar verildi (To-do list).
    
    Toplantı Dökümü:
    ${fullText}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    thinkingConfig: { thinkingLevel: "low" },
                    temperature: 0.5 // Lower temperature for more consistent, factual summaries
                }
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const summary = data.candidates[0].content.parts[0].text;
        showModal("Toplantı Özeti", summary);
    } catch (err) {
        alert("Yapay Zeka Hatası: " + err.message);
    }
}

// UI Components

function updateUI() {
    if (document.getElementById('meet-tools-container')) return;

    const container = document.createElement('div');
    container.id = 'meet-tools-container';
    Object.assign(container.style, {
        position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)',
        zIndex: '10000', display: 'flex', gap: '8px', padding: '5px',
        background: 'rgba(255,255,255,0.95)', borderRadius: '30px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', border: '1px solid #eee'
    });

    const createBtn = (text, color, action) => {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '8px 20px', borderRadius: '20px', border: 'none',
            cursor: 'pointer', fontWeight: 'bold', color: 'white', backgroundColor: color,
            fontSize: '13px', transition: 'all 0.2s ease'
        });
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1.0)';
        btn.onclick = action;
        return btn;
    };

    container.appendChild(createBtn('📥 Transkript', '#5f6368', downloadTranscript));
    container.appendChild(createBtn('✨ Özetle', '#2a70cd', generateAISummary));
    
    document.body.appendChild(container);
}

function showModal(title, text) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0', backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: '10001', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: 'white', width: '600px', maxHeight: '80%', padding: '35px',
        borderRadius: '20px', overflowY: 'auto', position: 'relative', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', fontFamily: 'sans-serif'
    });

    modal.innerHTML = `
        <h2 style="margin-top:0; color:#1a73e8; border-bottom:1px solid #eee; padding-bottom:15px;">${title}</h2>
        <div style="white-space:pre-wrap; line-height:1.7; font-size:15px; color:#3c4043; margin:25px 0;">${text}</div>
        <div style="display:flex; gap:12px; border-top:1px solid #eee; padding-top:20px;">
            <button id="copy-summary" style="padding:10px 25px; background:#1a73e8; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Kopyala</button>
            <button id="close-modal" style="padding:10px 25px; background:#f1f3f4; color:#3c4043; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Kapat</button>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById('close-modal').onclick = () => overlay.remove();
    document.getElementById('copy-summary').onclick = () => {
        navigator.clipboard.writeText(text);
        const copyBtn = document.getElementById('copy-summary');
        copyBtn.innerText = "Kopyalandı! ✅";
        setTimeout(() => copyBtn.innerText = "Kopyala", 2000);
    };
}

// Saving the text logic

const processCaptions = () => {
    // Only update UI if absolutely necessary
    updateUI(); 
    
    const blocks = document.querySelectorAll(SELECTORS.block);
    const activeBlock = blocks[blocks.length - 1];

    if (!activeBlock) return;

    if (activeBlock !== state.lastBlock) {
        state.lastBlock = activeBlock;
        state.offset = 0;
    }

    const textEl = activeBlock.querySelector(SELECTORS.text);
    const nameEl = activeBlock.querySelector(SELECTORS.name);

    if (textEl) {
        const fullText = textEl.innerText.trim();
        if (fullText.length > state.offset) {
            clearTimeout(state.timeout);
            
            state.timeout = setTimeout(() => {
                const chunk = fullText.substring(state.offset).trim();
                if (chunk) {
                    const name = nameEl ? nameEl.innerText : "Siz";
                    if (name !== state.currentSpeaker) {
                        state.transcript.push(`\n[${getTimestamp()}] ${name}:`);
                        state.currentSpeaker = name;
                    }
                    state.transcript.push(`- ${chunk}`);
                    state.offset = fullText.length;
                    console.log(`✨ [${name}]: ${chunk}`);
                }
            }, 2500);
        }
    }
};

// Initialize
if (state.observer) state.observer.disconnect();
state.observer = new MutationObserver(processCaptions);
state.observer.observe(document.body, { childList: true, subtree: true, characterData: true });

console.log("✅ Meet Summarizer is Active.");