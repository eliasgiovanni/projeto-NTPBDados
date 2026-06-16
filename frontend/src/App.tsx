import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Plus, 
  Filter, 
  Search, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  LogOut,
  Bell,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  Filler
);

const API_URL = 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Novos estados adicionados
  const [clients, setClients] = useState<any[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<number>(1);
  const [selectedProduct, setSelectedProduct] = useState<number>(0);
  const [saleQuantity, setSaleQuantity] = useState<number>(1);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      notify('Erro ao carregar produtos.', 'error');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar categorias.');
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`);
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      notify('Erro ao carregar métricas.', 'error');
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/clients`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar clientes.');
    }
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchDashboard(), fetchClients()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchProducts, fetchCategories, fetchDashboard, fetchClients]);

  // Seta o primeiro produto disponível como padrão
  useEffect(() => {
    if (products.length > 0 && selectedProduct === 0) {
      const firstAvailable = products.find(p => p.estoque > 0);
      if (firstAvailable) setSelectedProduct(firstAvailable.id);
    }
  }, [products, selectedProduct]);

  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newProduct = {
      nome: formData.get('nome'),
      preco: Number(formData.get('preco')),
      estoque: Number(formData.get('estoque')),
      categoria_id: Number(formData.get('categoria_id')),
      descricao: formData.get('descricao')
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setShowModal(false);
      await Promise.all([fetchProducts(), fetchDashboard()]);
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleEditProduct = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedProduct = {
      preco: Number(formData.get('preco')),
      estoque: Number(formData.get('estoque')),
      descricao: formData.get('descricao')
    };

    try {
      const res = await fetch(`${API_URL}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setEditingProduct(null);
      await Promise.all([fetchProducts(), fetchDashboard()]);
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const handleAddClient = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newClient = {
      nome: formData.get('nome'),
      endereco: formData.get('endereco'),
      telefone: formData.get('telefone'),
      cpf: formData.get('cpf')
    };

    try {
      const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setShowClientModal(false);
      await fetchClients();
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const addToCart = () => {
    const prod = products.find(p => p.id === Number(selectedProduct));
    if (!prod) {
      notify('Selecione um produto válido.', 'error');
      return;
    }
    if (saleQuantity <= 0) {
      notify('A quantidade deve ser maior que zero.', 'error');
      return;
    }
    
    const existingCartItem = cart.find(item => item.id === prod.id);
    const totalQty = (existingCartItem?.quantity || 0) + saleQuantity;
    
    if (totalQty > prod.estoque) {
      notify(`Estoque insuficiente. Disponível: ${prod.estoque}`, 'error');
      return;
    }

    if (existingCartItem) {
      setCart(cart.map(item => item.id === prod.id ? { ...item, quantity: totalQty } : item));
    } else {
      setCart([...cart, { ...prod, quantity: saleQuantity }]);
    }
    notify(`Adicionado: ${prod.nome} (Qtd: ${saleQuantity})`);
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleProcessSale = async (e: any) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('O carrinho está vazio. Adicione produtos antes de finalizar.', 'error');
      return;
    }

    const saleData = {
      clienteId: selectedClient,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setCart([]);
      await Promise.all([fetchProducts(), fetchDashboard()]);
      setActiveTab('dashboard');
    } catch (err: any) {
      notify(err.message, 'error');
    }
  };

  const barData = useMemo(() => {
    if (!products.length) return null;
    const cats = [...new Set(products.map(p => p.categoria_nome || 'Sem Categoria'))];
    return {
      labels: cats,
      datasets: [{
        data: cats.map(cat => 
          products.filter(p => p.categoria_nome === cat).reduce((sum, p) => sum + (Number(p.preco) * Number(p.sales || 0)), 0)
        ),
        backgroundColor: '#6366f1',
        borderRadius: 6,
        barThickness: 32,
      }]
    };
  }, [products]);



  if (loading) {
    return (
      <div className="loading-screen">
        <Loader2 className="spinner" size={48} />
        <p>Sincronizando com PostgreSQL...</p>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || { receita_total: 0, total_vendas: 0, total_produtos: 0, ticket_medio: 0 };
  const ranking = dashboardData?.ranking || [];

  return (
    <div className="admin-layout">
      {notification && (
        <div className={`toast-notification fade-in ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {notification.msg}
        </div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="brand">
          <div className="brand-icon">N</div>
          {isSidebarOpen && <span className="brand-name">NTPB<span>Dados</span></span>}
        </div>

        <nav className="side-nav">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" expanded={isSidebarOpen} />
          <NavItem active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} icon={<Package size={20} />} label="Produtos" expanded={isSidebarOpen} />
          <NavItem active={activeTab === 'vendas'} onClick={() => setActiveTab('vendas')} icon={<ShoppingCart size={20} />} label="Vendas" expanded={isSidebarOpen} />
          <NavItem active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')} icon={<Users size={20} />} label="Clientes" expanded={isSidebarOpen} />
          <div className="nav-divider" />
          <NavItem icon={<Settings size={20} />} label="Configurações" expanded={isSidebarOpen} />
        </nav>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="avatar">W</div>
            {isSidebarOpen && <div className="user-info"><p className="name">Wanderson</p><p className="role">Admin Project</p></div>}
            {isSidebarOpen && <LogOut size={16} className="logout-icon" />}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!isSidebarOpen)}><MoreVertical size={20} /></button>
            <div className="search-bar"><Search size={18} /><input type="text" placeholder="Consultar banco..." /></div>
          </div>
          <div className="header-right">
            <button className="icon-btn"><Calendar size={20} /></button>
            <button className="icon-btn notification"><Bell size={20} /><span></span></button>
            <button className="btn-primary-new" onClick={() => { setActiveTab('produtos'); setShowModal(true); }}>
              <Plus size={18} /><span>Novo Produto</span>
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="view-container fade-in">
            <div className="view-header">
              <div><h1>Visão Geral</h1><p>Dados reais recuperados do PostgreSQL.</p></div>
              <div className="date-picker-sim"><Filter size={16} /><span>Base Ativa</span></div>
            </div>

            <div className="metrics-row">
              <MetricCard title="Receita Total" value={`R$ ${Number(metrics.receita_total).toLocaleString()}`} trend="+Real-time" up={true} icon={<TrendingUp color="#6366f1" />} />
              <MetricCard title="Vendas" value={metrics.total_vendas} trend="Histórico" up={true} icon={<ShoppingCart color="#10b981" />} />
              <MetricCard title="Produtos" value={metrics.total_produtos} trend="Ativos" up={true} icon={<Package color="#f59e0b" />} />
              <MetricCard title="Ticket Médio" value={`R$ ${Number(metrics.ticket_medio).toFixed(0)}`} trend="Médio" up={true} icon={<TrendingUp color="#8b5cf6" />} />
            </div>

            <div className="dashboard-grid-new">
              <div className="chart-card main-chart">
                <div className="card-head"><h3>Vendas por Categoria</h3></div>
                <div className="chart-wrapper">{barData && <Bar data={barData} options={{...chartOptions, maintainAspectRatio: false}} />}</div>
              </div>
              <div className="table-card side-list">
                <div className="card-head"><h3>Top Ranking (Sales)</h3></div>
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Vendas</th></tr></thead>
                  <tbody>
                    {ranking.map((p: any, i: number) => (
                      <tr key={i}>
                        <td><div className="product-cell"><span>{p.nome}</span></div></td>
                        <td><span className="status-pill high">{p.sales}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'produtos' && (
          <div className="view-container fade-in">
            <div className="view-header">
              <div><h1>Inventário Central</h1><p>Conectado ao PostgreSQL 16.</p></div>
              <button className="btn-primary-new" onClick={() => setShowModal(true)}><Plus size={18} /> Adicionar Produto</button>
            </div>
            
            <div className="inventory-grid-v2">
              <div className="table-card full-width">
                <table className="custom-table">
                  <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Ações</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <div className="product-img">{p.nome[0]}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{p.nome}</span>
                              {p.descricao && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.descricao}</span>}
                            </div>
                          </div>
                        </td>
                        <td><span className="badge-cat">{p.categoria_nome || 'Geral'}</span></td>
                        <td>R$ {Number(p.preco).toLocaleString()}</td>
                        <td>
                          <div className="stock-indicator">
                            <div className="stock-bar"><div className="fill" style={{ width: `${Math.min(p.estoque * 5, 100)}%`, backgroundColor: p.estoque < 5 ? '#ef4444' : '#10b981' }}></div></div>
                            <span>{p.estoque} un</span>
                          </div>
                        </td>
                        <td>
                          <button 
                            className="icon-btn" 
                            onClick={() => setEditingProduct(p)} 
                            title="Editar Produto"
                          >
                            <Settings size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendas' && (
           <div className="view-container fade-in">
              <div className="view-header"><h1>Terminal de Vendas</h1></div>
              
              <div className="sales-grid-container">
                 {/* Formulário de Adicionar ao Carrinho */}
                 <div className="cart-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.25rem' }}>Adicionar ao Carrinho</h3>
                    <div className="modern-form" style={{ padding: 0 }}>
                       <div className="field">
                          <label>Cliente (Postgres)</label>
                          <select 
                             value={selectedClient} 
                             onChange={(e) => setSelectedClient(Number(e.target.value))}
                             required
                          >
                             {clients.map(c => (
                               <option key={c.id} value={c.id}>
                                 {c.nome} {c.cpf ? `(CPF: ${c.cpf})` : ''}
                               </option>
                             ))}
                          </select>
                       </div>
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                          <div className="field">
                             <label>Produto</label>
                             <select 
                                value={selectedProduct} 
                                onChange={(e) => setSelectedProduct(Number(e.target.value))}
                             >
                                <option value="0" disabled>Selecione um produto</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id} disabled={p.estoque === 0}>
                                    {p.nome} (Estoque: {p.estoque} un) - R$ {Number(p.preco).toFixed(2)}
                                  </option>
                                ))}
                             </select>
                          </div>
                          <div className="field">
                             <label>Quantidade</label>
                             <input 
                                type="number" 
                                value={saleQuantity} 
                                onChange={(e) => setSaleQuantity(Math.max(1, Number(e.target.value)))}
                                min="1" 
                             />
                          </div>
                       </div>
                       
                       <button type="button" className="btn-add-item" onClick={addToCart}>
                          <Plus size={16} /> Adicionar Item
                       </button>
                    </div>
                 </div>

                 {/* Carrinho de Compras */}
                 <div className="cart-card">
                    <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                       <span>Carrinho de Vendas</span>
                       <span className="badge-pill-client">
                          {clients.find(c => c.id === selectedClient)?.nome || 'Consumidor Final'}
                       </span>
                    </h3>
                    
                    {cart.length === 0 ? (
                       <div className="empty-cart-state">
                          <ShoppingCart size={40} style={{ opacity: 0.5 }} />
                          <p>O carrinho está vazio</p>
                       </div>
                    ) : (
                       <>
                          <div className="cart-items-list">
                             {cart.map((item) => (
                                <div className="cart-item" key={item.id}>
                                   <div className="cart-item-info">
                                      <span className="cart-item-name">{item.nome}</span>
                                      <span className="cart-item-meta">
                                         {item.quantity} un x R$ {Number(item.preco).toFixed(2)}
                                      </span>
                                   </div>
                                   <div className="cart-item-actions">
                                      <span className="cart-item-price">
                                         R$ {(Number(item.preco) * item.quantity).toFixed(2)}
                                      </span>
                                      <button className="btn-remove-cart" onClick={() => removeFromCart(item.id)}>
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                </div>
                             ))}
                          </div>
                          
                          <div className="cart-summary">
                             <div className="cart-total-row">
                                <span>Total Geral</span>
                                <span>
                                   R$ {cart.reduce((sum, item) => sum + (Number(item.preco) * item.quantity), 0).toFixed(2)}
                                </span>
                             </div>
                             <button onClick={handleProcessSale} className="btn-primary-new full">
                                Finalizar Venda e Abater Estoque
                             </button>
                          </div>
                       </>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'clientes' && (
           <div className="view-container fade-in">
              <div className="view-header">
                 <div>
                    <h1>Cadastro de Clientes</h1>
                    <p>Gerencie a base de clientes do PostgreSQL.</p>
                 </div>
                 <button className="btn-primary-new" onClick={() => setShowClientModal(true)}>
                    <Plus size={18} /> Novo Cliente
                 </button>
              </div>
              
              <div className="inventory-grid-v2">
                 <div className="table-card full-width">
                    <table className="custom-table">
                       <thead>
                          <tr>
                             <th>ID</th>
                             <th>Nome</th>
                             <th>CPF</th>
                             <th>Telefone</th>
                             <th>Endereço</th>
                          </tr>
                       </thead>
                       <tbody>
                          {clients.map(c => (
                             <tr key={c.id}>
                                <td>#{c.id}</td>
                                <td><strong>{c.nome}</strong></td>
                                <td>{c.cpf || <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}</td>
                                <td>{c.telefone || <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}</td>
                                <td>{c.endereco || <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content scale-up">
            <div className="modal-header">
              <h2>Novo Produto</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddProduct} className="modern-form">
              <div className="field">
                <label>Nome do Produto</label>
                <input name="nome" required placeholder="Ex: Câmera Mirrorless" />
              </div>
              <div className="row">
                <div className="field">
                  <label>Categoria</label>
                  <select name="categoria_id" required>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Preço (R$)</label>
                  <input name="preco" type="number" step="0.01" required placeholder="0.00" />
                </div>
              </div>
              <div className="field">
                <label>Estoque Inicial</label>
                <input name="estoque" type="number" required placeholder="Qtd" />
              </div>
              <div className="field">
                <label>Descrição do Produto</label>
                <textarea 
                  name="descricao" 
                  className="field input textarea-field" 
                  placeholder="Escreva detalhes sobre o produto..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-new">Salvar no PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="modal-overlay">
          <div className="modal-content scale-up">
            <div className="modal-header">
              <h2>Novo Cliente</h2>
              <button onClick={() => setShowClientModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddClient} className="modern-form">
              <div className="field">
                <label>Nome Completo</label>
                <input name="nome" required placeholder="Ex: Maria Oliveira" />
              </div>
              <div className="field">
                <label>CPF</label>
                <input name="cpf" placeholder="Ex: 000.000.000-00" maxLength={14} />
              </div>
              <div className="field">
                <label>Telefone</label>
                <input name="telefone" placeholder="Ex: (63) 99999-9999" />
              </div>
              <div className="field">
                <label>Endereço Completo</label>
                <input name="endereco" placeholder="Ex: Av. JK, Quadra 104, Palmas - TO" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setShowClientModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-new">Salvar no PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content scale-up">
            <div className="modal-header">
              <h2>Editar Produto: {editingProduct.nome}</h2>
              <button onClick={() => setEditingProduct(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleEditProduct} className="modern-form">
              <div className="row">
                <div className="field">
                  <label>Preço de Venda (R$)</label>
                  <input 
                    name="preco" 
                    type="number" 
                    step="0.01" 
                    required 
                    defaultValue={editingProduct.preco} 
                  />
                </div>
                <div className="field">
                  <label>Quantidade em Estoque</label>
                  <input 
                    name="estoque" 
                    type="number" 
                    required 
                    defaultValue={editingProduct.estoque} 
                  />
                </div>
              </div>
              <div className="field">
                <label>Descrição do Produto</label>
                <textarea 
                  name="descricao" 
                  className="field input textarea-field" 
                  defaultValue={editingProduct.descricao || ''} 
                  placeholder="Escreva detalhes sobre o produto..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-text" onClick={() => setEditingProduct(null)}>Cancelar</button>
                <button type="submit" className="btn-primary-new">Atualizar no PostgreSQL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const chartOptions: any = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { borderDash: [5, 5] } }
  }
};

function NavItem({ icon, label, active, onClick, expanded }: any) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}{expanded && <span>{label}</span>}{active && expanded && <div className="active-indicator" />}
    </button>
  );
}

function MetricCard({ title, value, trend, up, icon }: any) {
  return (
    <div className="metric-card-new">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <p className="metric-title">{title}</p>
        <h2 className="metric-value">{value}</h2>
        <div className={`metric-trend ${up ? 'up' : 'down'}`}>
          {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

export default App;
