/**
 * Svelte Action to trigger animations on scroll
 * Usage: <div use:reveal={{ threshold: 0.1, delay: 0 }}>...</div>
 */
export function reveal(node: HTMLElement, { threshold = 0.1, delay = 0 } = {}) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        node.classList.add('reveal-visible');
                    }, delay);
                    observer.unobserve(node);
                }
            });
        },
        {
            threshold,
            rootMargin: '0px 0px -50px 0px' // Slightly offset to trigger when element is a bit into the viewport
        }
    );

    observer.observe(node);

    return {
        destroy() {
            observer.disconnect();
        }
    };
}
