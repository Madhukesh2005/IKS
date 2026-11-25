import { useEffect, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react';

type PointerLikeEvent = ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>;
type SpotlightOptions = { tilt?: boolean };

export function spawnRipple(event: PointerLikeEvent, dark = false) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement)) return;
  if (getComputedStyle(target).overflow === 'visible') target.style.overflow = 'hidden';
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = `optical-ripple${dark ? ' optical-ripple-dark' : ''}`;
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  ripple.setAttribute('aria-hidden', 'true');
  const cleanupTimer = window.setTimeout(() => ripple.remove(), 650);
  ripple.addEventListener(
    'animationend',
    () => {
      window.clearTimeout(cleanupTimer);
      ripple.remove();
    },
    { once: true },
  );
  if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
  target.appendChild(ripple);
}

export function useSpotlightSurface({ tilt = false }: SpotlightOptions = {}) {
  return {
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      if (event.pointerType === 'touch') return;
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      element.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      element.style.setProperty('--my', `${event.clientY - rect.top}px`);

      const target = event.target;
      const interacting =
        target instanceof Element &&
        Boolean(target.closest('input, select, textarea, button, [data-interactive]'));
      const disabled = window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (tilt && !interacting && !disabled) {
        element.style.transition = 'border-color 180ms ease, box-shadow 180ms ease';
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        element.style.transform = `perspective(900px) rotateX(${-y * 2.2}deg) rotateY(${x * 2.2}deg)`;
      }
    },
    onPointerLeave(event: ReactPointerEvent<HTMLElement>) {
      event.currentTarget.style.transition =
        'border-color 180ms ease, box-shadow 180ms ease, transform 360ms var(--ease-spring)';
      event.currentTarget.style.removeProperty('--mx');
      event.currentTarget.style.removeProperty('--my');
      event.currentTarget.style.removeProperty('transform');
    },
  };
}

export function useMagnetic(maxPull = 5) {
  return {
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      if (
        event.pointerType === 'touch' ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        event.currentTarget.matches(':disabled')
      ) return;
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / Math.max(1, rect.width / 2);
      const y = (event.clientY - rect.top - rect.height / 2) / Math.max(1, rect.height / 2);
      const dx = x * maxPull;
      const dy = y * maxPull;
      element.style.transform = `translate(${dx}px, ${dy}px)`;
      const inner = element.querySelector<HTMLElement>('[data-magnetic-inner]');
      if (inner) inner.style.transform = `translate(${dx * 0.5}px, ${dy * 0.5}px)`;
    },
    onPointerLeave(event: ReactPointerEvent<HTMLElement>) {
      event.currentTarget.style.transform = '';
      const inner = event.currentTarget.querySelector<HTMLElement>('[data-magnetic-inner]');
      if (inner) inner.style.transform = '';
    },
  };
}

export function useScrambleValue(target: string | number | null) {
  const finalValue = target === null ? '' : String(target);
  const [displayValue, setDisplayValue] = useState(finalValue);

  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      finalValue.length > 24 ||
      !/\d/.test(finalValue)
    ) return;

    let frame = 0;
    let startTime = 0;
    let active = true;
    const animate = (time: number) => {
      if (!active) return;
      if (!startTime) startTime = time;
      const progress = Math.min(1, (time - startTime) / 260);
      const locked = Math.floor(progress * finalValue.length);
      const scrambled = finalValue.split('').map((char, index) => {
        if (!/\d/.test(char) || index < locked) return char;
        return String(Math.floor(Math.random() * 10));
      }).join('');
      setDisplayValue(progress === 1 ? finalValue : scrambled);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [finalValue]);

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reducedMotion || finalValue.length > 24 || !/\d/.test(finalValue)
    ? finalValue
    : displayValue;
}
