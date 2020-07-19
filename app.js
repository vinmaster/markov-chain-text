window.addEventListener('load', () => main(), false);

function main() {
  new Vue({
    el: '#app',
    data() {
      return {
        loading: false,
        mode: 'by-char',
        sourceType: 'text',
        source: '',
        order: 3,
        outputSize: 100,
        output: '',
      };
    },
    methods: {
      async generate() {
        this.loading = true;
        let text;
        const markov = new Markov(this.order, this.mode);

        if (this.sourceType === 'url') {
          try {
            const proxyUrl = 'https://nope-cors.herokuapp.com/';
            const convertTextUrl = 'https://boilerpipe-web.appspot.com/extract?url=';
            const response = await fetch(proxyUrl + convertTextUrl + this.source);
            const htmlText = await response.text();
            const html = document.createElement('html');
            html.innerHTML = htmlText;
            const texts = [];
            for (const element of html.querySelectorAll('*')) {
              if (['span'].includes(element.nodeName.toLowerCase())) {
                texts.push(element.textContent);
              }
            }
            text = texts.join(' ');
            // console.log(text);
          } catch (error) {
            console.error(error);
            this.output = 'Error fetching text from webpage';
            this.loading = false;
            return;
          }
        } else {
          text = this.source;
        }
        markov.build(text);
        this.output = markov.generate(this.outputSize);
        this.loading = false;
      },
    },
  });
}

class Markov {
  constructor(order, mode) {
    this.order = order;
    this.mode = mode;
    this.ngrams = {};
  }

  build(text) {
    if (this.mode === 'by-char') {
      if (text.length < this.order) return false;
      const lines = text.split('\n');

      for (const line of lines) {
        for (let i = 0; i < line.length - this.order; i++) {
          const gram = line.substring(i, i + this.order);
          const next = line.charAt(i + this.order);

          if (!this.ngrams[gram]) {
            this.ngrams[gram] = [];
          }
          this.ngrams[gram].push(next);
        }
      }
    } else if (this.mode === 'by-word') {
      const words = text.split(/\s+/);
      if (words.length < this.order) return false;

      for (let i = 0; i < words.length - this.order; i++) {
        const gram = words.slice(i, i + this.order).join(' ');
        const next = words[i + this.order];

        if (!this.ngrams[gram]) {
          this.ngrams[gram] = [];
        }
        this.ngrams[gram].push(next);
      }
    }
  }

  generate(length) {
    let current = this.randomElement(Object.keys(this.ngrams));
    if (this.mode === 'by-char') {
      let output = current;

      for (let i = 0; i < length; i++) {
        if (!this.ngrams[current]) break;

        const nextList = this.ngrams[current];
        const next = this.randomElement(nextList);
        output += next;
        current = output.substring(output.length - this.order, output.length);
      }

      return output;
    } else if (this.mode === 'by-word') {
      let output = current.split(/\s+/);

      for (let i = 0; i < length; i++) {
        if (!this.ngrams[current]) break;

        const nextList = this.ngrams[current];
        const next = this.randomElement(nextList);
        output.push(next);
        current = output.slice(output.length - this.order, output.length).join(' ');
      }

      return output.join(' ');
    }
  }

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}
