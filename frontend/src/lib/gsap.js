import gsap from "gsap";

/**
 * Standard GSAP page fade-in transition
 */
export const pageEnter = (element) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, y: 15 },
    { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
  );
};

/**
 * Card entrance animation with slight scale
 */
export const cardEnter = (element) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { opacity: 0, scale: 0.96, y: 15 },
    { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" }
  );
};

/**
 * Staggered children entrance animation
 */
export const staggerChildren = (container, delay = 0.05) => {
  if (!container) return;
  const children = container.children;
  if (!children || children.length === 0) return;
  gsap.fromTo(
    children,
    { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: 0.35, stagger: delay, ease: "power2.out" }
  );
};

/**
 * Shake animation (used for OTP / credential error feedback)
 */
export const shake = (element) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { x: -8 },
    {
      x: 8,
      duration: 0.08,
      repeat: 5,
      yoyo: true,
      ease: "power1.inOut",
      onComplete: () => {
        gsap.set(element, { x: 0 });
      },
    }
  );
};

/**
 * Button click / press feedback
 */
export const buttonPress = (element) => {
  if (!element) return;
  gsap.to(element, {
    scale: 0.95,
    duration: 0.08,
    ease: "power1.out",
    yoyo: true,
    repeat: 1,
  });
};

/**
 * Hover lift animation
 */
export const hoverLift = (element, liftAmount = -3) => {
  if (!element) return;
  gsap.to(element, {
    y: liftAmount,
    duration: 0.2,
    ease: "power2.out",
  });
};

/**
 * Hover reset animation
 */
export const hoverReset = (element) => {
  if (!element) return;
  gsap.to(element, {
    y: 0,
    duration: 0.2,
    ease: "power2.out",
  });
};

/**
 * Subtle flip animation for badges or cards
 */
export const flipElement = (element) => {
  if (!element) return;
  gsap.fromTo(
    element,
    { rotateX: 90, opacity: 0.6 },
    { rotateX: 0, opacity: 1, duration: 0.35, ease: "back.out(1.7)" }
  );
};

export default gsap;
