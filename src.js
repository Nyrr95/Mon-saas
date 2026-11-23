
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://ptdogghbtxwxsclxzuui.supabase.co',
  'sb_publishable_UiLYUyVXpX05zF48O-1HNg_NzxP1xAS'
);

const app = document.getElementById('app');

app.innerHTML = `
<style>
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif;background:#f4f7fc;color:#172544}
header{background:#172b55;color:white;text-align:center;padding:32px 16px}
main{max-width:960px;margin:auto;padding:28px 16px;text-align:center}
.plans{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
.plan,.panel{background:white;padding:24px;border-radius:15px;box-shadow:0 4px 15px #17254415}
.plan{width:240px}
.price{font-size:32px;font-weight:bold}
button{background:#2563eb;color:white;border:0;border-radius:8px;padding:12px 18px;cursor:pointer;margin:5px}
button:disabled{opacity:.6}
input{width:100%;max-width:360px;display:block;margin:12px auto;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:inherit}
.panel{max-width:700px;margin:30px auto}
#message,#invoice-message{min-height:22px}
.invoice{border:1px solid #e1e6ef;border-radius:10px;padding:15px;margin:12px 0;text-align:left;overflow-wrap:anywhere}
footer{text-align:center;padding:28px;color:#667085}
[hidden]{display:none!important}
</style>
<header>
<h1>RelancePro</h1>
<p>La gestion des relances de factures, simplifiée.</p>
</header>
<main>
<section>
<h2>Gagnez du temps sur vos impayés</h2>
<p>Découvrez nos offres.</p>
<div class="plans">
${[['Basic',29],['Pro',49],['Premium',79]].map(([name,price])=>`
<div class="plan">
<h2>${name}</h2>
<p class="price">${price} €</p>
<p>par mois</p>
<button disabled>Bientôt disponible</button>
</div>`).join('')}
</div>
</section>

<section class="panel" id="auth">
<h2>Créer un compte ou se connecter</h2>
<form id="auth-form">
<input id="email" type="email" placeholder="Adresse email" autocomplete="email" required>
<input id="password" type="password" placeholder="Mot de passe (6 caractères minimum)" minlength="6" required>
<button id="signup" type="button">Créer mon compte</button>
<button id="signin" type="submit">Me connecter</button>
</form>
<p id="message" role="status"></p>
</section>

<section class="panel" id="account" hidden>
<h2>Mon espace client</h2>
<p>Connecté avec : <strong id="account-email"></strong></p>
<button id="signout">Me déconnecter</button>
<h2>Tableau de bord</h2>
<div class="dashboard">
  <div class="stat">
    <h3>Total des factures</h3>
    <strong id="total-count">0</strong>
  </div>
  <div class="stat">
    <h3>Factures impayées</h3>
    <strong id="unpaid-total">0 €</strong>
  </div>
  <div class="stat">
    <h3>Factures en retard</h3>
    <strong id="overdue-total">0 €</strong>
  </div>
  <div class="stat">
    <h3>Factures payées</h3>
    <strong id="paid-total">0 €</strong>
  </div>
</div>
<h2>Ajouter une facture</h2>
<form id="invoice-form">
<input id="client-name" placeholder="Nom du client" required>
<input id="client-email" type="email" placeholder="Email du client (facultatif)">
<input id="amount" type="number" min="0" step="0.01" placeholder="Montant en euros" required>
<label for="due-date">Date limite de paiement</label>
<input id="due-date" type="date" required>
<button type="submit">Enregistrer la facture</button>
</form>

<p id="invoice-message" role="status"></p>
<h2>Mes factures</h2>
<div id="invoices"></div>
</section>
</main>
<footer>© RelancePro</footer>
`;
const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
.dashboard{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:15px;
  margin:20px 0;
}
.stat{
  background:#eef4ff;
  padding:20px;
  border-radius:12px;
  text-align:center;
}
.stat h3{font-size:15px;color:#526078}
.stat strong{font-size:26px;color:#172b55}
`;
document.head.appendChild(dashboardStyle);
const $ = id => document.getElementById(id);
const message = text => $('message').textContent = text;
const invoiceMessage = text => $('invoice-message').textContent = text;

let currentUser = null;
let requestVersion = 0;

function showSession(session) {
  currentUser = session?.user || null;
  requestVersion++;
  $('auth').hidden = !!currentUser;
  $('account').hidden = !currentUser;
  $('account-email').textContent = currentUser?.email || '';
  $('invoices').replaceChildren();
  const today = new Date().toLocaleDateString('en-CA');
const euros = n => Number(n).toLocaleString('fr-FR', {
  style:'currency',
  currency:'EUR'
});

const unpaid = data.filter(f => f.statut === 'impayee');
const paid = data.filter(f => f.statut === 'payee');
const overdue = unpaid.filter(f => f.date_echeance < today);

$('total-count').textContent = data.length;
$('unpaid-total').textContent =
  euros(unpaid.reduce((s,f) => s + Number(f.montant), 0));
$('overdue-total').textContent =
  euros(overdue.reduce((s,f) => s + Number(f.montant), 0));
$('paid-total').textContent =
  euros(paid.reduce((s,f) => s + Number(f.montant), 0));
  invoiceMessage('');

  if (currentUser) loadInvoices();
}

$('signup').onclick = async () => {
  if (!$('auth-form').reportValidity()) return;
  message('Création du compte...');
  const {data,error} = await supabase.auth.signUp({
    email:$('email').value.trim(),
    password:$('password').value
  });
  if (error) return message(error.message);
  if (data.session) showSession(data.session);
  else message('Vérifie tes emails pour confirmer ton compte.');
};

$('auth-form').onsubmit = async event => {
  event.preventDefault();
  message('Connexion...');
  const {data,error} = await supabase.auth.signInWithPassword({
    email:$('email').value.trim(),
    password:$('password').value
  });
  if (error) return message(error.message);
  showSession(data.session);
};

$('signout').onclick = async () => {
  const {error} = await supabase.auth.signOut();
  if (error) return alert(error.message);
  showSession(null);
  message('Déconnecté.');
};

$('invoice-form').onsubmit = async event => {
  event.preventDefault();
  const user = currentUser;
  if (!user) return;

  const button = $('invoice-form').querySelector('button');
  button.disabled = true;
  invoiceMessage('Enregistrement...');

  const {error} = await supabase.from('factures').insert({
    user_id:user.id,
    client_nom:$('client-name').value.trim(),
    client_email:$('client-email').value.trim() || null,
    montant:Number($('amount').value),
    date_echeance:$('due-date').value,
    statut:'impayee'
  });

  button.disabled = false;
  if (currentUser?.id !== user.id) return;

  if (error) {
    invoiceMessage('Erreur : ' + error.message);
    return;
  }

  $('invoice-form').reset();
  invoiceMessage('Facture enregistrée !');
  requestVersion++;
await loadInvoices();
};

async function loadInvoices() {
  const user = currentUser;
  if (!user) return;
  const version = ++requestVersion;

  $('invoices').textContent = 'Chargement...';

  const {data,error} = await supabase
    .from('factures')
    .select('id,client_nom,client_email,montant,date_echeance,statut')
    .eq('user_id',user.id)
    .order('date_echeance',{ascending:true});

  if (currentUser?.id !== user.id || version !== requestVersion) return;

  if (error) {
    $('invoices').textContent = 'Erreur : ' + error.message;
    return;
  }

  $('invoices').replaceChildren();

  if (!data.length) {
    $('invoices').textContent = 'Aucune facture pour le moment.';
    return;
  }

  for (const facture of data) {
    const box = document.createElement('div');
    box.className = 'invoice';

    const info = document.createElement('p');
    const amount = Number(facture.montant).toLocaleString('fr-FR',{
      style:'currency',currency:'EUR'
    });

    info.textContent =
      facture.client_nom + ' | ' + amount +
      ' | Échéance : ' + facture.date_echeance +
      ' | ' + (facture.statut === 'payee' ? 'Payée' : 'Impayée');

    box.append(info);

    const statusButton = document.createElement('button');
    statusButton.textContent = facture.statut === 'payee'
      ? 'Marquer impayée' : 'Marquer payée';

    statusButton.onclick = async () => {
      const activeUser = currentUser;
      if (!activeUser) return;
      statusButton.disabled = true;

      const {error} = await supabase.from('factures')
        .update({
          statut:facture.statut === 'payee' ? 'impayee' : 'payee'
        })
        .eq('id',facture.id)
        .eq('user_id',activeUser.id);

      if (error) {
        alert(error.message);
        statusButton.disabled = false;
      } else if (currentUser?.id === activeUser.id) {
        await loadInvoices();
      }
    };

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Supprimer';

    deleteButton.onclick = async () => {
      const activeUser = currentUser;
      if (!activeUser || !confirm('Supprimer cette facture ?')) return;
      deleteButton.disabled = true;

      const {error} = await supabase.from('factures')
        .delete()
        .eq('id',facture.id)
        .eq('user_id',activeUser.id);

      if (error) {
        alert(error.message);
        deleteButton.disabled = false;
      } else if (currentUser?.id === activeUser.id) {
        await loadInvoices();
      }
    };

    box.append(statusButton,deleteButton);
    $('invoices').append(box);
  }
}

supabase.auth.onAuthStateChange((_event,session) => {
  showSession(session);
});

supabase.auth.getSession().then(({data,error}) => {
  if (error) message(error.message);
  else showSession(data.session);
});
