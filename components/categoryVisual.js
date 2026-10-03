import { categoriesData } from '../data/categories';

const GROUP_ICONS = {
  'Moradia e Utilidades': 'home',
  Transporte: 'directions-car',
  Alimentação: 'restaurant',
  'Saúde e Bem-estar': 'favorite',
  'Cuidados Pessoais': 'spa',
  'Educação e Desenvolvimento': 'menu-book',
  'Lazer e Entretenimento': 'confirmation-number',
  Financeiro: 'account-balance-wallet',
  'Família e Animais': 'pets',
  Outros: 'category',
  'Categoria deste gasto': 'label',
};

export const chartColors = ['#12856A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF6B4A', '#14B8A6', '#6366F1', '#84CC16'];

export function visualForCategory(name) {
  const group = categoriesData.find((item) => item.subcategories.includes(name));
  const title = group?.title || 'Categoria deste gasto';
  const color = chartColors[(group ? categoriesData.indexOf(group) : chartColors.length - 1) % chartColors.length];
  return {
    icon: GROUP_ICONS[title] || 'label',
    color,
    tint: `${color}22`,
    group: title,
  };
}

export function colorForIndex(index) {
  return chartColors[index % chartColors.length];
}
