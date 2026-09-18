import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ROLES = { ADMIN: 'Administrator', USER: 'Normal User', STORE_OWNER: 'Store Owner' };

// --- API Helper ---
async function api(path, options = {}) {
  let response = await fetch(API_BASE_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
  });

  let data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    window.dispatchEvent(new Event('auth:expired'));
    return new Promise(() => {});
  }

  if (!response.ok) throw data;
  return data;
}

const getErrorMessage = (error) =>
  error.message || Object.values(error.errors || {})[0] || 'Something went wrong.';

// --- Reusable UI Elements ---
function Field({ label, value, set, type = 'text', hint, ...props }) {
  return (
    <label>
      {label}
      <input type={type} value={value} onChange={(e) => set(e.target.value)} {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Alert({ message }) {
  return message ? <p className="alert">{message}</p> : null;
}

function Modal({ title, close, children }) {
  return (
    <div className="shade">
      <div className="modal">
        <button className="x" onClick={close}>×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="table">
      <table>
        <thead>{children[0]}</thead>
        <tbody>{React.Children.toArray(children).slice(1)}</tbody>
      </table>
    </div>
  );
}

function SortHeader({ name, fieldKey, query, setQuery }) {
  const isSelected = query.sort === fieldKey;
  const directionIndicator = isSelected ? (query.order === 'asc' ? '↑' : '↓') : '';

  return (
    <th
      onClick={() =>
        setQuery({
          ...query,
          sort: fieldKey,
          order: isSelected && query.order === 'asc' ? 'desc' : 'asc',
        })
      }
    >
      {name} {directionIndicator}
    </th>
  );
}

// --- Authentication Component ---
function Auth({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (key) => (value) => setFormData({ ...formData, [key]: value });

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    try {
      const endpoint = isSignup ? '/auth/register' : '/auth/login';
      const result = await api(endpoint, { method: 'POST', body: JSON.stringify(formData) });
      onAuthSuccess(result);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  return (
    <main className="auth">
      <form onSubmit={handleSubmit}>
        <b>Store<span>Score</span></b>
        <h1>{isSignup ? 'Create account' : 'Welcome back'}</h1>
        
        {isSignup && (
          <>
            <Field label="Full name" value={formData.name} set={updateField('name')} placeholder="Your full name" hint="Name must be between 20 and 60 characters." minLength="20" maxLength="60" required />
            <Field label="Address" value={formData.address} set={updateField('address')} hint="Maximum 400 characters." maxLength="400" required />
          </>
        )}

        <Field label="Email" type="email" value={formData.email} set={updateField('email')} required />
        <Field label="Password" type="password" value={formData.password} set={updateField('password')} placeholder={isSignup ? 'Create a secure password' : ''} hint={isSignup ? 'Password must be 8-16 characters and include at least one uppercase letter and one special character.' : ''} minLength={isSignup ? 8 : undefined} maxLength={isSignup ? 16 : undefined} required />

        <Alert message={errorMsg} />
        
        <button>{isSignup ? 'Sign up' : 'Log in'}</button>
        <button type="button" className="link" onClick={() => { setIsSignup(!isSignup); setErrorMsg(''); }}>
          {isSignup ? 'Already have an account? Log in' : 'Need an account? Sign up'}
        </button>
      </form>
    </main>
  );
}

// --- Navigation Header Component ---
function Header({ user, page, setPage, onLogout }) {
  const navItems = user.role === 'ADMIN'
    ? [['dashboard', 'Dashboard'], ['users', 'Users'], ['stores', 'Stores']]
    : user.role === 'STORE_OWNER'
    ? [['owner', 'My dashboard']]
    : [['stores', 'Stores']];

  return (
    <header>
      <b>Store<span>Score</span></b>
      <nav>
        {navItems.map(([key, label]) => (
          <button key={key} className={page === key ? 'on' : ''} onClick={() => setPage(key)}>
            {label}
          </button>
        ))}
      </nav>
      <aside>
        {user.name}
        <button onClick={() => setPage('password')}>Password</button>
        <button onClick={onLogout}>Log out</button>
      </aside>
    </header>
  );
}

// --- Store Management & Directory Component ---
function Stores({ token, admin }) {
  const [query, setQuery] = useState({ q: '', sort: 'name', order: 'asc' });
  const [storesData, setStoresData] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  async function loadStores() {
    try {
      const res = await api('/stores?' + new URLSearchParams(query), { token });
      setStoresData(res.stores);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  useEffect(() => { loadStores(); }, [query.sort, query.order]);

  async function handleRate(storeId, score) {
    try {
      await api(`/stores/${storeId}/rating`, { token, method: 'PUT', body: JSON.stringify({ score: +score }) });
      loadStores();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  const updateQueryField = (key) => (value) => setQuery({ ...query, [key]: value });

  return (
    <section>
      <div className="title">
        <div>
          <h1>{admin ? 'Store directory' : 'Find stores'}</h1>
          <p>{admin ? 'All stores registered on the platform.' : 'Search, submit, and update your ratings.'}</p>
        </div>
        {admin && <StoreForm token={token} reload={loadStores} />}
      </div>

      <div className="filters">
        <input placeholder="Search stores..." value={query.q} onChange={(e) => updateQueryField('q')(e.target.value)} />
        <button onClick={loadStores}>Search</button>
      </div>

      <Alert message={errorMsg} />

      <Table>
        <tr>
          <SortHeader name="Store" fieldKey="name" query={query} setQuery={setQuery} />
          <SortHeader name="Email" fieldKey="email" query={query} setQuery={setQuery} />
          <SortHeader name="Address" fieldKey="address" query={query} setQuery={setQuery} />
          <SortHeader name="Overall rating" fieldKey="average_rating" query={query} setQuery={setQuery} />
          {!admin && <th>Your rating</th>}
        </tr>
        {storesData.map((store) => (
          <tr key={store.id}>
            <td>{store.name}</td>
            <td>{store.email}</td>
            <td>{store.address}</td>
            <td>{store.average_rating || 'No ratings'} {store.rating_count ? `(${store.rating_count})` : ''}</td>
            {!admin && (
              <td>
                <select value={store.user_rating || ''} onChange={(e) => e.target.value && handleRate(store.id, e.target.value)}>
                  <option value="">Rate…</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </td>
            )}
          </tr>
        ))}
      </Table>
    </section>
  );
}

function StoreForm({ token, reload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (k) => (v) => setFormData({ ...formData, [k]: v });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api('/admin/stores', { token, method: 'POST', body: JSON.stringify({ ...formData, ownerId: formData.ownerId || null }) });
      setIsOpen(false);
      reload();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>+ Add store</button>
      {isOpen && (
        <Modal title="Add store" close={() => setIsOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Store name" value={formData.name} set={updateField('name')} required />
            <Field label="Email" type="email" value={formData.email} set={updateField('email')} required />
            <Field label="Address" value={formData.address} set={updateField('address')} maxLength="400" required />
            <Field label="Store owner ID (optional)" value={formData.ownerId} set={updateField('ownerId')} />
            <Alert message={errorMsg} />
            <button>Create store</button>
          </form>
        </Modal>
      )}
    </>
  );
}

// --- Admin Users Component ---
function Users({ token }) {
  const [query, setQuery] = useState({ q: '', role: '', sort: 'name', order: 'asc' });
  const [usersData, setUsersData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  async function loadUsers() {
    const res = await api('/admin/users?' + new URLSearchParams(query), { token });
    setUsersData(res.users);
  }

  useEffect(() => { loadUsers(); }, [query.sort, query.order, query.role]);

  const updateQueryField = (k) => (v) => setQuery({ ...query, [k]: v });

  return (
    <section>
      <div className="title">
        <div>
          <h1>User directory</h1>
          <p>Manage all platform users.</p>
        </div>
        <UserForm token={token} reload={loadUsers} />
      </div>

      <nav style={{ marginBottom: '16px', display: 'flex', gap: '5px' }}>
        {[
          { l: 'All Users', v: '' },
          { l: 'Administrators', v: 'ADMIN' },
          { l: 'Normal Users', v: 'USER' },
          { l: 'Store Owners', v: 'STORE_OWNER' },
        ].map((tab) => (
          <button key={tab.l} className={query.role === tab.v ? 'on' : ''} onClick={() => updateQueryField('role')(tab.v)}>
            {tab.l}
          </button>
        ))}
      </nav>

      <div className="filters">
        <input placeholder="Search users..." value={query.q} onChange={(e) => updateQueryField('q')(e.target.value)} />
        <button onClick={loadUsers}>Search</button>
      </div>

      <Table>
        <tr>
          <SortHeader name="Name" fieldKey="name" query={query} setQuery={setQuery} />
          <SortHeader name="Email" fieldKey="email" query={query} setQuery={setQuery} />
          <SortHeader name="Address" fieldKey="address" query={query} setQuery={setQuery} />
          <SortHeader name="Role" fieldKey="role" query={query} setQuery={setQuery} />
          <th>Rating</th>
        </tr>
        {usersData.map((user) => (
          <tr key={user.id} onClick={() => setSelectedUser(user)}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.address}</td>
            <td>{ROLES[user.role]}</td>
            <td>{user.role === 'STORE_OWNER' ? user.rating || 'No ratings' : '—'}</td>
          </tr>
        ))}
      </Table>

      {selectedUser && <UserDetail token={token} user={selectedUser} close={() => setSelectedUser(null)} />}
    </section>
  );
}

function UserForm({ token, reload }) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', address: '', password: '', role: 'USER' });
  const [errorMsg, setErrorMsg] = useState('');

  const updateField = (k) => (v) => setFormData({ ...formData, [k]: v });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api('/admin/users', { token, method: 'POST', body: JSON.stringify(formData) });
      setIsOpen(false);
      reload();
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>+ Add user</button>
      {isOpen && (
        <Modal title="Add user" close={() => setIsOpen(false)}>
          <form onSubmit={handleSubmit}>
            <Field label="Full name" value={formData.name} set={updateField('name')} minLength="20" maxLength="60" hint="Name must be between 20 and 60 characters." required />
            <Field label="Email" type="email" value={formData.email} set={updateField('email')} required />
            <Field label="Address" value={formData.address} set={updateField('address')} maxLength="400" hint="Maximum 400 characters." required />
            <Field label="Password" type="password" value={formData.password} set={updateField('password')} minLength="8" maxLength="16" hint="Password must be 8-16 characters and include at least one uppercase letter and one special character." required />
            <label>
              Role
              <select value={formData.role} onChange={(e) => updateField('role')(e.target.value)}>
                {Object.entries(ROLES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>
            <Alert message={errorMsg} />
            <button>Create user</button>
          </form>
        </Modal>
      )}
    </>
  );
}

function UserDetail({ token, user, close }) {
  const [details, setDetails] = useState(user);

  useEffect(() => {
    api(`/admin/users/${user.id}`, { token }).then((res) => setDetails(res.user));
  }, []);

  return (
    <Modal title="User details" close={close}>
      <p><b>Name:</b> {details.name}</p>
      <p><b>Email:</b> {details.email}</p>
      <p><b>Address:</b> {details.address}</p>
      <p><b>Role:</b> {ROLES[details.role]}</p>
      {details.role === 'STORE_OWNER' && <p><b>Store rating:</b> {details.rating || 'No ratings'}</p>}
    </Modal>
  );
}

// --- Admin Dashboard Component ---
function Dashboard({ token }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    api('/admin/stats', { token }).then(setStats);
  }, []);

  return (
    <section>
      <h1>Platform overview</h1>
      <div className="cards">
        {[
          ['Users', stats.users],
          ['Stores', stats.stores],
          ['Submitted ratings', stats.ratings],
        ].map(([title, val]) => (
          <article key={title}>
            <p>{title}</p>
            <strong>{val ?? '—'}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

// --- Store Owner Dashboard Component ---
function Owner({ token }) {
  const [query, setQuery] = useState({ sort: 'updated_at', order: 'desc' });
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/owner/dashboard?' + new URLSearchParams(query), { token }).then(setData);
  }, [query.sort, query.order]);

  if (!data) return <p>Loading dashboard…</p>;

  return (
    <section>
      <h1>{data.store.name}</h1>
      <div className="cards">
        <article>
          <p>Average rating</p>
          <strong>{data.store.average_rating || '—'} / 5</strong>
        </article>
        <article>
          <p>Submitted ratings</p>
          <strong>{data.ratings.length}</strong>
        </article>
      </div>

      <Table>
        <tr>
          <SortHeader name="Name" fieldKey="name" query={query} setQuery={setQuery} />
          <SortHeader name="Email" fieldKey="email" query={query} setQuery={setQuery} />
          <SortHeader name="Address" fieldKey="address" query={query} setQuery={setQuery} />
          <SortHeader name="Rating" fieldKey="score" query={query} setQuery={setQuery} />
        </tr>
        {data.ratings.map((r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            <td>{r.email}</td>
            <td>{r.address}</td>
            <td>{r.score} / 5</td>
          </tr>
        ))}
      </Table>
    </section>
  );
}

// --- Password Update Component ---
function Password({ token }) {
  const [formData, setFormData] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ error: '', ok: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await api('/auth/password', { token, method: 'PATCH', body: JSON.stringify(formData) });
      setMsg({ error: '', ok: res.message });
    } catch (err) {
      setMsg({ error: getErrorMessage(err), ok: '' });
    }
  }

  return (
    <section className="password">
      <h1>Update password</h1>
      <form onSubmit={handleSubmit}>
        <Field label="Current password" type="password" value={formData.currentPassword} set={(v) => setFormData({ ...formData, currentPassword: v })} required />
        <Field label="New password" type="password" value={formData.newPassword} set={(v) => setFormData({ ...formData, newPassword: v })} minLength="8" maxLength="16" hint="Password must be 8-16 characters and include at least one uppercase letter and one special character." required />
        <Alert message={msg.error || msg.ok} />
        <button>Update password</button>
      </form>
    </section>
  );
}

// --- Root Application Component ---
function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('session') || 'null'));
  const [page, setPage] = useState(() => {
    if (!session) return 'stores';
    if (session.user.role === 'ADMIN') return 'dashboard';
    if (session.user.role === 'STORE_OWNER') return 'owner';
    return 'stores';
  });

  useEffect(() => {
    const handleExpired = () => {
      localStorage.removeItem('session');
      setSession(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  if (!session) {
    return (
      <Auth
        onAuthSuccess={(res) => {
          localStorage.setItem('session', JSON.stringify(res));
          setSession(res);
          setPage(res.user.role === 'ADMIN' ? 'dashboard' : res.user.role === 'STORE_OWNER' ? 'owner' : 'stores');
        }}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('session');
    setSession(null);
  };

  const renderContent = () => {
    if (page === 'dashboard') return <Dashboard token={session.token} />;
    if (page === 'users') return <Users token={session.token} />;
    if (page === 'owner') return <Owner token={session.token} />;
    if (page === 'password') return <Password token={session.token} />;
    return <Stores token={session.token} admin={session.user.role === 'ADMIN'} />;
  };

  return (
    <>
      <Header user={session.user} page={page} setPage={setPage} onLogout={handleLogout} />
      <main className="content">{renderContent()}</main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
