@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 40 24% 98%;
    --foreground: 0 0% 8.6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 8.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 8.6%;
    --primary: 303 56% 32%;
    --primary-foreground: 0 0% 100%;
    --secondary: 40 18% 94%;
    --secondary-foreground: 0 0% 8.6%;
    --muted: 40 16% 95%;
    --muted-foreground: 0 0% 38%;
    --accent: 44 69% 58%;
    --accent-foreground: 0 0% 8.6%;
    --destructive: 0 62% 42%;
    --destructive-foreground: 0 0% 100%;
    --border: 40 12% 88%;
    --input: 40 12% 86%;
    --ring: 303 56% 32%;
    --chart-1: 303 56% 32%;
    --chart-2: 44 69% 58%;
    --chart-3: 0 0% 8.6%;
    --chart-4: 303 30% 62%;
    --chart-5: 44 40% 74%;
    --radius: 0.25rem;
    --font-heading: 'Cormorant Garamond', 'Times New Roman', serif;
    --font-body: 'PT Sans', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Cormorant Garamond', 'Times New Roman', serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    --sidebar-background: 0 0% 8.6%;
    --sidebar-foreground: 40 20% 94%;
    --sidebar-primary: 44 69% 58%;
    --sidebar-primary-foreground: 0 0% 8.6%;
    --sidebar-accent: 0 0% 15%;
    --sidebar-accent-foreground: 40 20% 94%;
    --sidebar-border: 0 0% 20%;
    --sidebar-ring: 44 69% 58%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html {
    -webkit-text-size-adjust: 100%;
    overflow-x: hidden;
  }

  body {
    @apply bg-background text-foreground font-body antialiased;
    overflow-x: hidden;
  }

  h1, h2, h3, h4 {
    @apply font-heading;
    letter-spacing: -0.01em;
  }

  ::selection {
    background: #DEB64B;
    color: #161616;
  }
}

@layer components {
  .label-eyebrow {
    @apply font-body text-[10px] font-bold uppercase;
    letter-spacing: 0.22em;
  }

  .rule-gold {
    @apply h-px w-10 bg-brand-gold;
  }

  .surface {
    @apply bg-card border border-brand-line rounded-sm;
  }
}

@layer utilities {
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .animate-rise {
    animation: rise 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}