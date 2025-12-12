"use client";

export function LeftSidebar() {
  return (
    <aside className="left-sidebar">
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Menu</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  💬 Conversas salvas
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  📚 Educação / Tele-educação
                </button>
              </li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Agentes</h3>
            <ul className="sidebar-list">
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  👨‍⚕️ Assistente Geral
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  ❤️ Cardiologia Pediátrica
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  🫁 Pneumologia Pediátrica
                </button>
              </li>
              <li className="sidebar-item">
                <button className="sidebar-link" type="button">
                  🧠 Neurologia Pediátrica
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* Rodapé com nome do usuário */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            FS
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Fabiano Souza</span>
            <span className="sidebar-user-role">UTI Pediátrica A</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

