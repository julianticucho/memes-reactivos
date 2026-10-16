import type { ReactNode } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  ariaLabel: string;
}

/* Envoltorio genérico de las pestañas de XP.css: un menu[role=tablist]
   cuyo botón activo lleva aria-selected, y un article[role=tabpanel]
   por pestaña oculto con el atributo hidden. XP.css dibuja el resto. */
const Tabs = ({ tabs, active, onChange, ariaLabel }: TabsProps) => {
  return (
    <section className="tabs">
      <menu role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            aria-controls={`tab-${tab.key}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </menu>
      {tabs.map((tab) => (
        <article
          key={tab.key}
          role="tabpanel"
          id={`tab-${tab.key}`}
          hidden={tab.key !== active}
        >
          {tab.content}
        </article>
      ))}
    </section>
  );
};

export default Tabs;
