import { useState, useRef, useEffect } from 'react';

interface AvatarImgProps {
  src: string;
  className: string;
  alt?: string;
}

// Maps fluent ui character folder names to native fallback emojis,
// shown while the CDN image loads or if it is missing/offline.
const EMOJI_MAP: Record<string, string> = {
  "Grinning face": "😀",
  "Grinning face with big eyes": "😃",
  "Grinning face with smiling eyes": "😄",
  "Beaming face with smiling eyes": "😁",
  "Grinning squinting face": "😆",
  "Grinning face with sweat": "😅",
  "Rolling on the floor laughing": "🤣",
  "Face with tears of joy": "😂",
  "Slightly smiling face": "🙂",
  "Upside-down face": "🙃",
  "Winking face": "😉",
  "Smiling face with smiling eyes": "😊",
  "Smiling face with halo": "😇",
  "Smiling face with hearts": "🥰",
  "Smiling face with heart-eyes": "😍",
  "Star-struck": "🤩",
  "Face blowing a kiss": "😘",
  "Kissing face": "😗",
  "Smiling face": "☺️",
  "Kissing face with smiling eyes": "😙",
  "Kissing face with closed eyes": "😚",
  "Smiling face with tear": "🥲",
  "Face savoring food": "😋",
  "Face with tongue": "😛",
  "Winking face with tongue": "😜",
  "Squinting face with tongue": "🤪",
  "Zany face": "🤪",
  "Money-mouth face": "🤑",
  "Clown face": "🤡",
  "Cowboy hat face": "🤠",
  "Detective": "🕵️",
  "Ninja": "🥷",
  "Astronaut": "🧑‍🚀",
  "Artist": "🧑‍🎨",
  "Alien": "👽",
  "Alien monster": "👾",
  "Robot": "🤖",
  "Ghost": "👻",
  "Goblin": "👺",
  "Ogre": "👹",
  "Skull": "💀",
  "Jack-o-lantern": "🎃",
  "Monkey": "🐒",
  "Monkey face": "🐵",
  "Gorilla": "🦍",
  "Orangutan": "🦧",
  "Dog face": "🐶",
  "Dog": "🐕",
  "Poodle": "🐩",
  "Wolf": "🐺",
  "Fox": "🦊",
  "Raccoon": "🦝",
  "Cat face": "🐱",
  "Cat": "🐈",
  "Lion": "🦁",
  "Tiger face": "🐯",
  "Tiger": "🐅",
  "Leopard": "🐆",
  "Horse face": "🐴",
  "Unicorn": "🦄",
  "Zebra": "🦓",
  "Deer": "🦌",
  "Cow face": "🐮",
  "Pig face": "🐷",
  "Ram": "🐏",
  "Sheep": "🐑",
  "Goat": "🐐",
  "Camel": "🐫",
  "Llama": "🦙",
  "Giraffe": "🦒",
  "Elephant": "🐘",
  "Mouse face": "🐭",
  "Rabbit face": "🐰",
  "Bear": "🐻",
  "Panda": "🐼",
  "Koala": "🐨",
  "Sloth": "🦥",
  "Frog": "🐸",
  "Dragon face": "🐲",
  "Dragon": "🐉",
  "T-Rex": "🦖",
  "Octopus": "🐙",
  "Dolphin": "🐬",
  "Whale": "🐳",
  "Shark": "🦈",
  "Tropical fish": "🐠",
  "Owl": "🦉",
  "Flamingo": "🦩",
  "Peacock": "🦚",
  "Star": "⭐",
  "Heart with ribbon": "💝",
  "Sparkles": "✨",
  "Fire": "🔥",
  "Collision": "💥",
  "Balloon": "🎈",
  "Party popper": "🎉",
  "Partying face": "🥳",
  "Sunflower": "🌻",
  "Avocado": "🥑",
  "French fries": "🍟",
  "Pizza": "🍕",
  "Hamburger": "🍔",
  "Hot dog": "🌭",
  "Beer mug": "🍺",
  "Wine glass": "🍷",
  "Cocktail glass": "🍹"
};

function getUnicodeFallback(src: string): string {
  try {
    const parts = src.split('/');
    const folderIndex = parts.indexOf('assets');
    if (folderIndex !== -1 && parts[folderIndex + 1]) {
      const decoded = decodeURIComponent(parts[folderIndex + 1]);
      return EMOJI_MAP[decoded] || '👤';
    }
  } catch {
    /* malformed src — fall through to the generic avatar */
  }
  return '👤';
}

export function AvatarImg({ src, className, alt = '' }: AvatarImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Reset on src change; show cached images immediately (onLoad may have
  // already fired before React attached its listener).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setLoaded(false);
    setError(false);
    const img = ref.current;
    if (img?.complete) {
      if (img.naturalWidth > 0) setLoaded(true);
      else setError(true);
    }
  }, [src]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const unicode = getUnicodeFallback(src);

  return (
    <div className={`avatar-container ${className}`}>
      {(!loaded || error) && (
        <span className={`avatar-fallback-emoji${!loaded && !error ? ' loading-pulse' : ''}`}>
          {unicode}
        </span>
      )}
      {!error && (
        <img
          ref={ref}
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
          decoding="async"
          className={`avatar-img${loaded ? ' loaded' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
