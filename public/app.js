// Verificar autenticación
const token = localStorage.getItem('vb_token');
if (!token) {
    window.location.href = '/';
}

// Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('vb_token');
    window.location.href = '/';
});

// Enviar formulario de análisis
const analyzeForm = document.getElementById('analyzeForm');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = analyzeBtn.querySelector('.btn-text');
const loader = analyzeBtn.querySelector('.loader');
const resultsGrid = document.getElementById('resultsGrid');

analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('matchUrl').value;
    const minOdds = parseFloat(document.getElementById('minOdds').value);

    // UI Loading state
    btnText.textContent = "Analizando...";
    loader.classList.remove('hidden');
    analyzeBtn.disabled = true;
    resultsGrid.innerHTML = ''; // Limpiar resultados anteriores

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url, minOdds })
        });

        const data = await response.json();

        if (data.success) {
            renderResults(data.results);
        } else {
            alert(data.error || "Error al analizar la URL");
        }
    } catch (error) {
        alert("Error de conexión con el servidor");
    } finally {
        // UI Reset state
        btnText.textContent = "Iniciar Análisis Completo";
        loader.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
});

function renderResults(results) {
    if (results.length === 0) {
        resultsGrid.innerHTML = `
            <div class="empty-state">
                <p>No se encontraron apuestas de valor para esta cuota mínima.</p>
            </div>`;
        return;
    }

    let html = '';
    results.forEach(result => {
        html += `
            <div class="result-card glass-panel fade-in">
                <div class="card-header">
                    <h4>${result.match}</h4>
                    <span class="badge">Valor Detectado</span>
                </div>
                <div class="card-body">
                    <p class="market">Mercado: <strong>${result.market}</strong></p>
                    <p class="recommendation">Apuesta: <span class="highlight">${result.recommendation}</span></p>
                    
                    <div class="odds-compare">
                        <div class="odd-box">
                            <span>Cuota Aposta.la</span>
                            <span class="value success">${result.odds}</span>
                        </div>
                        <div class="odd-box">
                            <span>Cuota Real (Stats)</span>
                            <span class="value">${result.fairOdds}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    resultsGrid.innerHTML = html;
}
