export const playClickSound = (url: string, volume: number = 0.9) => {
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play();
};