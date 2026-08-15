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
    const teamHome = document.getElementById('teamHome').value;
    const teamAway = document.getElementById('teamAway').value;
    const files = document.getElementById('oddsImage').files;
    const minOdds = parseFloat(document.getElementById('minOdds').value);

    if (files.length === 0) {
        alert("Por favor sube al menos una captura de pantalla de las cuotas");
        return;
    }

    // UI Loading state
    btnText.textContent = "Analizando...";
    loader.classList.remove('hidden');
    analyzeBtn.disabled = true;
    resultsGrid.innerHTML = ''; // Limpiar resultados anteriores
    
    // UI Progress Bar
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';

    let allResults = [];
    let hasError = false;

    for (let i = 0; i < files.length; i++) {
        progressText.textContent = `Analizando imagen ${i + 1} de ${files.length}...`;
        
        const formData = new FormData();
        formData.append('teamHome', teamHome);
        formData.append('teamAway', teamAway);
        formData.append('minOdds', minOdds);
        formData.append('oddsImage', files[i]);

        try {
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                allResults = allResults.concat(data.results);
            } else {
                alert(`Error en la imagen ${i + 1}: ${data.error}`);
                hasError = true;
            }
        } catch (error) {
            alert(`Error de conexión con el servidor en la imagen ${i + 1}`);
            hasError = true;
        }

        // Actualizar progreso
        const percent = Math.round(((i + 1) / files.length) * 100);
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
    }

    if (allResults.length > 0) {
        // Agrupar por mercado y seleccionar únicamente la apuesta con mayor Expected Value (Edge)
        const bestPicksByMarket = {};
        
        for (const item of allResults) {
            const marketKey = item.market.trim().toLowerCase();
            
            if (!bestPicksByMarket[marketKey]) {
                bestPicksByMarket[marketKey] = item;
            } else {
                // Si ya existe una apuesta para este mercado, comparamos el Edge (Valor Esperado)
                // y nos quedamos con el más alto (el más rentable matemáticamente)
                if (item.edge > bestPicksByMarket[marketKey].edge) {
                    bestPicksByMarket[marketKey] = item;
                }
            }
        }
        
        // Convertir el objeto de mejores apuestas nuevamente a un array
        const finalResults = Object.values(bestPicksByMarket);
        
        renderResults(finalResults);
    } else if (!hasError) {
         resultsGrid.innerHTML = `
            <div class="empty-state">
                <p>No se encontraron apuestas con valor (Cuota Mínima: ${minOdds})</p>
            </div>
        `;
    }

    // UI Reset state
    btnText.textContent = "Iniciar Análisis Completo";
    loader.classList.add('hidden');
    analyzeBtn.disabled = false;
    setTimeout(() => { progressContainer.classList.add('hidden'); }, 3000);
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
                    <span class="badge">Edge: +${result.edge}%</span>
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
