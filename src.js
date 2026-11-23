
document.getElementById("app").innerHTML = `
<style>
body{margin:0;font-family:Arial;background:#f4f7fc;color:#172544}
header{background:#172b55;color:white;text-align:center;padding:35px 15px}
main{max-width:950px;margin:auto;padding:30px 15px;text-align:center}
.plans{display:flex;flex-wrap:wrap;justify-content:center;gap:20px}
.plan{background:white;padding:25px;border-radius:15px;box-shadow:0 4px 15px #ddd;width:220px}
.price{font-size:32px;font-weight:bold}
button{background:#2563eb;color:white;border:0;border-radius:8px;padding:12px 20px;cursor:pointer}
footer{text-align:center;padding:30px}
</style>
<header><h1>RelancePro</h1><p>Automatisez vos relances de factures</p></header>
<main>
<h2>Gagnez du temps sur vos impayés</h2>
<p>Découvrez nos trois formules.</p>
<div class="plans">
${[["Basic",29],["Pro",49],["Premium",79]].map(p=>`
<div class="plan"><h2>${p[0]}</h2><p class="price">${p[1]} €</p>
<p>Par mois</p><button onclick="alert('Abonnement bientôt disponible')">Choisir</button></div>`).join("")}
</div>
</main>
<footer>© RelancePro</footer>
`;
