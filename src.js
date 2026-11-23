
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
header h1{margin:0;font-size:32px}
header p{color:#dce7ff}
main{max-width:1000px;margin:auto;padding:28px 16px;text-align:center}
.plans{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
.plan,.panel{background:white;padding:24px;border-radius:15px;box-shadow:0 4px 15px #17254415}
.plan{width:240px}
.price{font-size:32px;font-weight:bold}
button{background:#2563eb;color:white;border:0;border-radius:8px;padding:12px 18px;cursor:pointer;margin:5px;font:inherit}
button:hover:not(:disabled){background:#1d4ed8}
button:disabled{opacity:.6;cursor:not-allowed}
input{width:100%;max-width:400px;display:block;margin:12px auto;padding:12px;border:1px solid #ccd3e0;border-radius:8px;font:inherit}
.panel{max-width:800px;margin:30px auto}
#message,#invoice-message{min-height:22px;overflow-wrap:anywhere}
.dashboard{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:15px;margin:25px 0}
.stat{background:#eef4ff;padding:20px;border-radius:12px}
.stat h3{font-size:14px;color:#526078}
.stat strong{font-size:25px;color:#172b55;overflow-wrap:anywhere}
.invoice{border:1px solid #e1e6ef;border-radius:10px;padding:15px;margin:12px 0;text-align:left;overflow-wrap:anywhere}
.invoice p{line-height:1.7}
.invoice-actions{display:flex;flex-wrap:wrap;gap:5px}
.invoice-actions button{font-size:13px}
.delete-button{background:#dc2626}
.delete-button:hover:not(:disabled){background:#b91c1c}
.status-paid{color:#15803d;font-weight:bold}
.status-unpaid{color:#b45309;font-weight:bold}
.status-late{color:#dc2626;font-weight:bold}
footer{text-align:center;padding:28px;color:#667085}
[hidden]{display:none!important}
</style>

<header>
<h1>RelancePro</h1>
<p>Gérez vos factures et suivez vos impayés simplement.</p>
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

<h2>📊 Tableau de bord</h2>
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

<h2>➕ Ajouter une facture</h2>
<form id="invoice-form">
<input id="client-name" placeholder="Nom du client" maxlength="150" required>
<input id="client-email" type="email" placeholder="Email du client (facultatif)">
<input id="amount" type="number" min="0" step="0.01" placeholder="Montant en euros" required>
<label for="due-date">Date limite de paiement</label>
<input id="due-date" type="date" required>
<button id="save-invoice" type="submit">Enregistrer la facture</button>
</form>

<p id="invoice-message" role="status"></p>

<h2>📋 Mes factures</h2>
<button id="refresh-invoices" type="button">Actualiser mes factures</button>
<div id="invoices"></div>
</section>
</main>

<footer>© RelancePro</footer>
`;

const $ = id => document.getElementById(id);

const message = text => {
  $('message').textContent = text;
};

const invoiceMessage = text => {
  $('invoice-message').textContent = text;
};

const euros = value => Number(value).toLocaleString('fr-FR', {
  style: 'currency',
  currency: 'EUR'
});

function localToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

let currentUser = null;
let requestVersion = 0;
let currentUserId = null;

function resetDashboard() {
  $('total-count').textContent = '0';
  $('unpaid-total').textContent = euros(0);
  $('overdue-total').textContent = euros(0);
  $('paid-total').textContent = euros(0);
}

function showSession(session) {
  const user = session?.user || null;
  const newUserId = user?.id || null;
  const changed = currentUserId !== newUserId;

  currentUser = user;

  $('auth').hidden = !!user;
  $('account').hidden = !user;
  $('account-email').textContent = user?.email || '';

  if (changed) {
    currentUserId = newUserId;
    requestVersion++;
    $('invoices').replaceChildren();
    resetDashboard();
    invoiceMessage('');

    if (user) {
      loadInvoices();
    }
  }
}

function updateDashboard(data) {
  const today = localToday();

  const unpaid = data.filter(f => f.statut === 'impayee');
  const paid = data.filter(f => f.statut === 'payee');
  const overdue = unpaid.filter(f => f.date_echeance < today);

  const sum = items => items.reduce(
    (total, f) => total + Number(f.montant), 0
  );

  $('total-count').textContent = String(data.length);
  $('unpaid-total').textContent = euros(sum(unpaid));
  $('overdue-total').textContent = euros(sum(overdue));
  $('paid-total').textContent = euros(sum(paid));
}

$('signup').onclick = async () => {
  if (!$('auth-form').reportValidity()) return;

  message('Création du compte...');

  const {data,error} = await supabase.auth.signUp({
    email: $('email').value.trim(),
    password: $('password').value
  });

  if (error) {
    message('Erreur : ' + error.message);
    return;
  }

  if (data.session) {
    showSession(data.session);
    message('');
  } else {
    message('Vérifie tes emails pour confirmer ton compte.');
  }
};

$('auth-form').onsubmit = async event => {
  event.preventDefault();
  message('Connexion...');

  const {data,error} = await supabase.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });

  if (error) {
    message('Erreur : ' + error.message);
    return;
  }

  showSession(data.session);
  message('');
};

$('signout').onclick = async () => {
  const {error} = await supabase.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  showSession(null);
  message('Déconnecté.');
};

$('invoice-form').onsubmit = async event => {
  event.preventDefault();

  const user = currentUser;
  if (!user) return;

  const button = $('save-invoice');
  button.disabled = true;
  invoiceMessage('Enregistrement...');

  try {
    const {error} = await supabase.from('factures').insert({
      user_id: user.id,
      client_nom: $('client-name').value.trim(),
      client_email: $('client-email').value.trim() || null,
      montant: Number($('amount').value),
      date_echeance: $('due-date').value,
      statut: 'impayee'
    });

    if (currentUser?.id !== user.id) return;

    if (error) {
      invoiceMessage('Erreur : ' + error.message);
      return;
    }

    $('invoice-form').reset();
    invoiceMessage('Facture enregistrée !');

    await loadInvoices();

  } catch (error) {
    if (currentUser?.id === user.id) {
      invoiceMessage('Erreur : ' + error.message);
    }
  } finally {
    button.disabled = false;
  }
};

async function loadInvoices() {
  const user = currentUser;
  if (!user) return;

  const version = ++requestVersion;

  $('invoices').textContent = 'Chargement des factures...';

  try {
    const {data,error} = await supabase
      .from('factures')
      .select('id,client_nom,client_email,montant,date_echeance,statut')
      .eq('user_id', user.id)
      .order('date_echeance', {ascending:true});

    if (currentUser?.id !== user.id || version !== requestVersion) {
      return;
    }

    if (error) {
      $('invoices').textContent = 'Erreur : ' + error.message;
      return;
    }

    const factures = data || [];

    updateDashboard(factures);
    $('invoices').replaceChildren();

    if (factures.length === 0) {
      $('invoices').textContent = 'Aucune facture pour le moment.';
      return;
    }

    for (const facture of factures) {
      const box = document.createElement('div');
      box.className = 'invoice';

      const info = document.createElement('p');
      const today = localToday();
      const late = facture.statut === 'impayee' &&
        facture.date_echeance < today;

      const status = document.createElement('span');

      if (facture.statut === 'payee') {
        status.textContent = 'Payée';
        status.className = 'status-paid';
      } else if (late) {
        status.textContent = 'En retard';
        status.className = 'status-late';
      } else {
        status.textContent = 'Impayée';
        status.className = 'status-unpaid';
      }

      const client = document.createElement('strong');
      client.textContent = facture.client_nom;

      info.append(
        client,
        document.createTextNode(
          ' | ' + euros(facture.montant) +
          ' | Échéance : ' + facture.date_echeance +
          ' | '
        ),
        status
      );

      if (facture.client_email) {
        const email = document.createElement('p');
        email.textContent = 'Email : ' + facture.client_email;
        box.append(email);
      }

      box.prepend(info);

      const actions = document.createElement('div');
      actions.className = 'invoice-actions';

      const statusButton = document.createElement('button');
      statusButton.textContent = facture.statut === 'payee'
        ? 'Marquer impayée'
        : 'Marquer payée';

      statusButton.onclick = async () => {
        const activeUser = currentUser;
        if (!activeUser) return;

        statusButton.disabled = true;

        try {
          const {error} = await supabase.from('factures')
            .update({
              statut: facture.statut === 'payee'
                ? 'impayee'
                : 'payee'
            })
            .eq('id', facture.id)
            .eq('user_id', activeUser.id);

          if (error) throw error;

          if (currentUser?.id === activeUser.id) {
            await loadInvoices();
          }
        } catch (error) {
          alert('Erreur : ' + error.message);
          statusButton.disabled = false;
        }
      };

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Supprimer';
      deleteButton.className = 'delete-button';

      deleteButton.onclick = async () => {
        const activeUser = currentUser;
        if (!activeUser) return;

        if (!confirm('Supprimer cette facture ?')) return;

        deleteButton.disabled = true;

        try {
          const {error} = await supabase.from('factures')
            .delete()
            .eq('id', facture.id)
            .eq('user_id', activeUser.id);

          if (error) throw error;

          if (currentUser?.id === activeUser.id) {
            await loadInvoices();
          }
        } catch (error) {
          alert('Erreur : ' + error.message);
          deleteButton.disabled = false;
        }
      };

      actions.append(statusButton, deleteButton);
      box.append(actions);
      $('invoices').append(box);
    }

  } catch (error) {
    if (currentUser?.id === user.id && version === requestVersion) {
      $('invoices').textContent = 'Erreur : ' + error.message;
    }
  }
}

$('refresh-invoices').onclick = () => {
  loadInvoices();
};

supabase.auth.onAuthStateChange((_event, session) => {
  showSession(session);
});

supabase.auth.getSession().then(({data,error}) => {
  if (error) {
    message('Erreur : ' + error.message);
  } else {
    showSession(data.session);
  }
});
