/** @returns {never} */
function die(message) {
  throw new Error(message);
}

class ScreenyApp extends HTMLElement {
  #abortController = new AbortController();

  connectedCallback() {
    this.#abortController = new AbortController();
    const { signal } = this.#abortController;
    this.form = this.querySelector("form");
    if (!this.form) {
      throw new Error("oh no");
    }
    this.addEventListener(
      "input",
      (event) => {
        this.#update();
      },
      { signal }
    );
    this.addEventListener(
      "click",
      (event) => {
        if (event.target?.closest("button")?.id === "swap") {
          this.#swap();
        }
      },
      { signal }
    );
    this.#update();
  }

  disconnectedCallback() {
    this.#abortController.abort();
  }

  /** @returns {HTMLElement} */
  #$(selector) {
    return this.querySelector(selector) || die(`can't find ${selector}`);
  }

  #update() {
    const form = this.#$("form");
    const data = new FormData(form);
    const oldWidth = Number(data.get("old-width"));
    const oldHeight = Number(data.get("old-height"));
    const oldSize = Number(data.get("old-size"));
    const oldScale = Number(data.get("old-scale"));
    const newWidth = Number(data.get("new-width"));
    const newHeight = Number(data.get("new-height"));
    const newSize = Number(data.get("new-size"));
    const newScale = Number(data.get("new-scale"));
    const oldPpi = this.#computePixelsPerInch(oldWidth, oldHeight, oldSize);
    const newPpi = this.#computePixelsPerInch(newWidth, newHeight, newSize);
    const oldEffectivePpi = oldPpi / (oldScale / 100);
    const newEffectivePpi = newPpi / (newScale / 100);
    const scale = this.#percentage(oldEffectivePpi / newEffectivePpi);
    this.#setResult("size", scale.toFixed(0));
    this.#setResult(
      "quality",
      this.#percentage(newScale / oldScale).toFixed(0)
    );
    this.#setResult("font", (16 * (scale / 100)).toFixed(1));
    this.#setResult("old-ppi-raw", oldPpi.toFixed(0));
    this.#setResult("old-ppi-effective", oldEffectivePpi.toFixed(0));
    this.#setResult("new-ppi-raw", newPpi.toFixed(0));
    this.#setResult("new-ppi-effective", newEffectivePpi.toFixed(0));
  }

  #setResult(name, value) {
    this.#$(`#result-${name}`).textContent = value;
  }

  #percentage(x) {
    return Number((x * 100).toFixed(2));
  }

  #computePixelsPerInch(pixelWidth, pixelHeight, diagonalInches) {
    const diagonalPixels = Math.sqrt(pixelWidth ** 2 + pixelHeight ** 2);
    return Number((diagonalPixels / diagonalInches).toFixed(2));
  }

  #swap() {
    const fields = ["width", "height", "size", "scale"];
    for (const f of fields) {
      const oldField = this.#$(`[name="old-${f}"]`);
      const newField = this.#$(`[name="new-${f}"]`);
      [oldField.value, newField.value] = [newField.value, oldField.value];
      this.#update();
    }
  }
}

customElements.define("screeny-app", ScreenyApp);
