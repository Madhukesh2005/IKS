import { useEffect, useRef, type RefObject } from 'react';

type OpticalStageProps = {
  coordRef: RefObject<HTMLSpanElement | null>;
};

type SonarRing = { x: number; y: number; radius: number; alpha: number };
type CrosshairTarget = { element: SVGElement; x: number; y: number };

export default function OpticalStage({ coordRef }: OpticalStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reticle = reticleRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !reticle) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const showReticle = finePointer && !reducedMotion;
    reticle.style.display = showReticle ? 'block' : 'none';

    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: false, down: false, interactive: false };
    const rings: SonarRing[] = [];
    let crosshairs: CrosshairTarget[] = [];
    let frame = 0;
    let scrollMeasureFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previousTime = 0;
    let isDark = document.documentElement.dataset.theme === 'dark';

    const requestDraw = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const measureCrosshairs = () => {
      crosshairs = Array.from(document.querySelectorAll<SVGElement>('[data-crosshair]')).map(element => {
        const rect = element.getBoundingClientRect();
        return { element, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
      requestDraw();
    };

    const scheduleCrosshairMeasure = () => {
      if (scrollMeasureFrame) return;
      scrollMeasureFrame = requestAnimationFrame(() => {
        scrollMeasureFrame = 0;
        measureCrosshairs();
      });
    };

    const resize = () => {
      measureCrosshairs();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestDraw();
    };

    const updatePointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      const firstMove = !pointer.active;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      pointer.interactive =
        event.target instanceof Element &&
        Boolean(event.target.closest('button, a, input[type="range"], [data-interactive]'));
      if (firstMove) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        if (showReticle) {
          reticle.style.opacity = '1';
          reticle.style.width = pointer.interactive ? '36px' : '24px';
          reticle.style.height = pointer.interactive ? '36px' : '24px';
          reticle.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%) scale(${pointer.down ? 0.75 : 1})`;
        }
      }
      pointer.active = true;
      if (coordRef.current) {
        coordRef.current.textContent = `X:${String(Math.round(event.clientX)).padStart(4, '0')} Y:${String(Math.round(event.clientY)).padStart(4, '0')}`;
      }
      requestDraw();
    };

    const onPointerLeave = () => {
      pointer.active = false;
      pointer.down = false;
      pointer.interactive = false;
      reticle.style.opacity = '0';
      crosshairs.forEach(({ element }) => {
        element.style.transform = 'rotate(0deg) scale(1)';
        element.style.color = isDark ? '#52525b' : '#d4d4d8';
      });
      if (coordRef.current) coordRef.current.textContent = 'X:0000 Y:0000';
      requestDraw();
    };

    const onPointerDown = (event: PointerEvent) => {
      rings.push({ x: event.clientX, y: event.clientY, radius: 4, alpha: 0.26 });
      pointer.down = true;
      requestDraw();
    };
    const onPointerUp = () => {
      pointer.down = false;
      requestDraw();
    };

    const draw = (time: number) => {
      frame = 0;
      const elapsed = previousTime ? Math.min(32, time - previousTime) : 16;
      previousTime = time;
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;
      context.clearRect(0, 0, width, height);

      const idleColor = isDark ? '#52525b' : '#d4d4d8';
      const nearColor = isDark ? '#fafafa' : '#09090b';
      const activeCrosshairs = crosshairs.map(target => {
        const distance = Math.hypot(pointer.x - target.x, pointer.y - target.y);
        const proximity = pointer.active ? Math.max(0, 1 - distance / 160) : 0;
        return {
          ...target,
          distance,
          proximity,
          rotation: proximity * 90,
          scale: 1 + proximity * 0.3,
          color: distance < 55 && pointer.active ? (isDark ? '#fb923c' : '#ea580c') : proximity ? nearColor : idleColor,
        };
      });

      if (pointer.active) {
        const spacing = 24;
        const startX = Math.max(0, Math.floor((pointer.x - 230) / spacing) * spacing);
        const endX = Math.min(width, pointer.x + 230);
        const startY = Math.max(0, Math.floor((pointer.y - 230) / spacing) * spacing);
        const endY = Math.min(height, pointer.y + 230);
        for (let x = startX; x <= endX; x += spacing) {
          for (let y = startY; y <= endY; y += spacing) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 220) continue;
            const proximity = 1 - distance / 220;
            const displacement = Math.min(5, proximity * 5);
            const drawX = x + (distance ? (dx / distance) * displacement : 0);
            const drawY = y + (distance ? (dy / distance) * displacement : 0);
            context.beginPath();
            context.arc(drawX, drawY, 1, 0, Math.PI * 2);
            context.fillStyle =
              distance < 65
                ? `rgba(${isDark ? '249, 115, 22' : '234, 88, 12'}, ${0.44 * proximity})`
                : `rgba(${isDark ? '255, 255, 255' : '9, 9, 11'}, ${(isDark ? 0.18 : 0.22) * proximity})`;
            context.fill();
          }
        }
      }

      for (let index = rings.length - 1; index >= 0; index--) {
        const ring = rings[index];
        ring.radius += elapsed * 0.12;
        ring.alpha *= 0.965;
        context.beginPath();
        context.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
        context.strokeStyle = `rgba(${isDark ? '255, 255, 255' : '9, 9, 11'}, ${ring.alpha})`;
        context.lineWidth = 1;
        context.stroke();
        if (ring.alpha < 0.012 || ring.radius > 110) rings.splice(index, 1);
      }

      if (showReticle) {
        reticle.style.opacity = pointer.active ? '1' : '0';
        reticle.style.width = pointer.interactive ? '36px' : '24px';
        reticle.style.height = pointer.interactive ? '36px' : '24px';
        reticle.style.borderColor = pointer.interactive
          ? isDark
            ? '#f97316'
            : '#ea580c'
          : isDark
            ? 'rgba(250,250,250,0.45)'
            : 'rgba(9,9,11,0.55)';
        reticle.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%) scale(${pointer.down ? 0.75 : 1})`;
      }

      activeCrosshairs.forEach(({ element, rotation, scale, color }) => {
        element.style.transform = `rotate(${rotation}deg) scale(${scale})`;
        element.style.color = color;
      });

      const pointerStillMoving =
        pointer.active &&
        (Math.abs(pointer.targetX - pointer.x) > 0.3 || Math.abs(pointer.targetY - pointer.y) > 0.3);
      if (rings.length || pointerStillMoving) requestDraw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(document.documentElement);

    const isCrosshairNode = (node: Node) =>
      node instanceof Element &&
      !node.classList.contains('optical-ripple') &&
      (node.matches('[data-crosshair]') || Boolean(node.querySelector('[data-crosshair]')));

    const mutationObserver = new MutationObserver(records => {
      let themeChanged = false;
      let hasCrosshairChange = false;
      for (const record of records) {
        if (record.type === 'attributes' && record.attributeName === 'data-theme') {
          isDark = document.documentElement.dataset.theme === 'dark';
          themeChanged = true;
        }
        if (record.type === 'childList') {
          if ([...record.addedNodes, ...record.removedNodes].some(isCrosshairNode)) {
            hasCrosshairChange = true;
          }
        }
      }
      if (hasCrosshairChange) measureCrosshairs();
      else if (themeChanged) requestDraw();
    });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scheduleCrosshairMeasure, { capture: true, passive: true });
    document.addEventListener('pointermove', updatePointer, { passive: true });
    document.documentElement.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', onPointerUp);
    resize();

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scheduleCrosshairMeasure, true);
      document.removeEventListener('pointermove', updatePointer);
      document.documentElement.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      cancelAnimationFrame(frame);
      if (scrollMeasureFrame) cancelAnimationFrame(scrollMeasureFrame);
    };
  }, [coordRef]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      />
      <div
        ref={reticleRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 24,
          height: 24,
          border: '1px solid rgba(9,9,11,0.55)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0,
          willChange: 'transform, opacity',
          transform: 'translate3d(-1000px, -1000px, 0) translate(-50%, -50%)',
          transition: 'width 160ms ease, height 160ms ease, border-color 160ms ease, opacity 120ms ease',
        }}
      />
    </>
  );
}
