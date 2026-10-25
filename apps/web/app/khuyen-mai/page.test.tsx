import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PromotionPage from './page';

describe('PromotionPage', () => {
  it('renders a compact promotion update with a catalog CTA', () => {
    render(<PromotionPage />);
    expect(
      screen.getByRole('heading', { name: 'Chương trình khuyến mãi đang được cập nhật' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Xem sản phẩm' })).toHaveAttribute('href', '/san-pham');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });
});
