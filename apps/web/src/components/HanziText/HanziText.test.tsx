import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HanziText } from './HanziText';
import { PinyinText } from './PinyinText';

describe('HanziText', () => {
  it('tags Hanzi as simplified Chinese and sets it in serif by default', () => {
    render(<HanziText>你好</HanziText>);
    const el = screen.getByText('你好');
    expect(el).toHaveAttribute('lang', 'zh-Hans');
    expect(el).toHaveClass('han');
    expect(el).not.toHaveClass('han--sans');
  });

  it('can switch to the sans face and a size', () => {
    render(
      <HanziText serif={false} size="hero">
        汉
      </HanziText>,
    );
    expect(screen.getByText('汉')).toHaveClass('han--sans', 'han--hero');
  });
});

describe('PinyinText', () => {
  it('tags pinyin with its language and keeps tone marks as given', () => {
    render(<PinyinText>nǐ hǎo</PinyinText>);
    const el = screen.getByText('nǐ hǎo');
    expect(el).toHaveAttribute('lang', 'zh-Latn-pinyin');
    expect(el).toHaveClass('py');
  });

  it('converts tone numbers to tone marks', () => {
    render(<PinyinText>ni3 hao3</PinyinText>);
    expect(screen.getByText('nǐ hǎo')).toBeVisible();
  });

  it('uses the brand colour class on request', () => {
    render(<PinyinText tone="brand">xué xí</PinyinText>);
    expect(screen.getByText('xué xí')).toHaveClass('py--brand');
  });
});
