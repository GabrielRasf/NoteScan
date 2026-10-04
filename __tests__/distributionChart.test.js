import React from 'react';
import { render } from '@testing-library/react-native';
import { Circle } from 'react-native-svg';
import { prepare } from 'react-native-svg/lib/commonjs/web/utils/prepare';
import DistributionChart from '../components/DistributionChart';

const summary = [
  { category: 'Supermercado', total: 45.9 },
  { category: 'Restaurantes e Delivery', total: 13 },
];

test('no navegador as fatias do gráfico giram em torno do centro sem gerar o atributo transform-origin', () => {
  const screen = render(<DistributionChart summary={summary} />);
  const slices = screen.UNSAFE_getAllByType(Circle).slice(1);

  expect(slices).toHaveLength(summary.length);
  slices.forEach((slice) => {
    const webProps = prepare({ props: slice.props });
    expect(webProps).not.toHaveProperty('transform-origin');
    expect(webProps.transform).toBe('rotate(-90 88 88)');
  });
});
