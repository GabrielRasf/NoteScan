export const categoriesData = [
  {
    title: 'Moradia e Utilidades',
    subcategories: [
      'Aluguel ou Financiamento',
      'Condomínio',
      'Energia',
      'Água e Saneamento',
      'Internet e Telefonia',
      'Gás',
    ],
  },
  {
    title: 'Transporte',
    subcategories: [
      'Combustível',
      'Transporte Público',
      'Manutenção do Veículo',
      'Seguro do Veículo',
      'Estacionamento e Pedágio',
    ],
  },
  {
    title: 'Alimentação',
    subcategories: [
      'Supermercado',
      'Restaurantes e Delivery',
      'Lanches e Café',
    ],
  },
  {
    title: 'Saúde e Bem-estar',
    subcategories: [
      'Plano de Saúde',
      'Medicamentos',
      'Consultas e Exames',
      'Academia',
      'Terapias',
    ],
  },
  {
    title: 'Cuidados Pessoais',
    subcategories: ['Higiene', 'Beleza e Estética', 'Roupas e Acessórios'],
  },
  {
    title: 'Educação e Desenvolvimento',
    subcategories: [
      'Mensalidades e Cursos',
      'Livros e Materiais',
      'Tecnologia e Software Educacional',
    ],
  },
  {
    title: 'Lazer e Entretenimento',
    subcategories: [
      'Cinema, Shows e Eventos',
      'Viagens',
      'Esportes',
      'Streaming e Assinaturas',
    ],
  },
  {
    title: 'Financeiro',
    subcategories: [
      'Impostos e Taxas',
      'Investimentos',
      'Reserva de Emergência',
      'Seguros',
      'Tarifas Bancárias',
    ],
  },
  {
    title: 'Família e Animais',
    subcategories: ['Despesas com Filhos', 'Educação Infantil', 'Pets'],
  },
  {
    title: 'Outros',
    subcategories: ['Presentes e Doações', 'Reparos e Manutenção', 'Gastos Eventuais'],
  },
];

export function allSubcategoryNames() {
  return categoriesData.flatMap((group) => group.subcategories);
}

export function filterCatalog(selection, currentCategory) {
  const enabled = new Set(
    Object.entries(selection || {})
      .filter(([, value]) => value === true)
      .map(([name]) => name)
  );

  const source =
    enabled.size === 0
      ? categoriesData
      : categoriesData
          .map((group) => ({
            ...group,
            subcategories: group.subcategories.filter((name) => enabled.has(name)),
          }))
          .filter((group) => group.subcategories.length > 0);

  const visible = new Set(source.flatMap((group) => group.subcategories));
  if (currentCategory && !visible.has(currentCategory)) {
    return [
      { title: 'Categoria deste gasto', subcategories: [currentCategory] },
      ...source,
    ];
  }

  return source;
}

export function isKnownCategory(name, currentCategory) {
  if (!name || typeof name !== 'string') return false;
  if (currentCategory && name === currentCategory) return true;
  return allSubcategoryNames().includes(name);
}
