export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


export const openModal = (dialogId: string) => {
  const modal = document.getElementById(dialogId) as HTMLDialogElement;
  modal.showModal();
};

export const closeModal = (dialogId: string) => {
  const modal = document.getElementById(dialogId) as HTMLDialogElement;
  modal.close();
};


export const efectoClickClient = async (elementId: string, callback: () => void) => {
  const element = document.getElementById(elementId) as HTMLButtonElement | null;

  if (!element) {
    console.error(`Elemento con id "${elementId}" no encontrado.`);
    return;
  }

  element.style.backgroundColor = 'tomato';
  element.style.color = 'yellow';
  await wait(500)
  callback();

};

export const efectoClickServer = (elementId: string, callback: () => void) => {
  const element = document.getElementById(elementId) as HTMLButtonElement | null;

  if (!element) {
    console.error(`Elemento con id "${elementId}" no encontrado.`);
    return;
  }

  element.addEventListener("click", async (event) => {
    event.preventDefault();
    element.style.backgroundColor = 'tomato';
    element.style.color = 'yellow';
    await wait(500)
    callback();
  });
};