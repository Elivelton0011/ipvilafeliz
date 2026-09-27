/* =========================================================
   Igreja Presbiteriana de Vila Feliz — script.js
   Comportamento do menu de navegação mobile e pequenas
   interações do Hero. Vanilla JavaScript, sem dependências.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  if (!navToggle || !primaryNav) return;

  const fecharMenu = () => {
    primaryNav.classList.remove("is-open");
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
  };

  const alternarMenu = () => {
    const aberto = primaryNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", aberto);
    navToggle.setAttribute("aria-expanded", String(aberto));
  };

  navToggle.addEventListener("click", alternarMenu);

  // Fecha o menu ao clicar em qualquer link de navegação.
  primaryNav.querySelectorAll(".nav__link").forEach((link) => {
    link.addEventListener("click", fecharMenu);
  });

  // Fecha o menu com a tecla Esc, por acessibilidade.
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      fecharMenu();
    }
  });

  // ---------------------------------------------------------
  // Efeito de revelação por cursor (spotlight sobre image(2))
  // Apenas em dispositivos com mouse/trackpad de precisão.
  // ---------------------------------------------------------
  const heroSection = document.getElementById("hero");
  const heroReveal = document.getElementById("heroReveal");
  const suportaCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (heroSection && heroReveal && suportaCursor) {
    let alvoX = -1000;
    let alvoY = -1000;
    let atualX = -1000;
    let atualY = -1000;
    let animando = false;

    const lerp = (inicio, fim, quantidade) => inicio + (fim - inicio) * quantidade;

    const atualizarQuadro = () => {
      atualX = lerp(atualX, alvoX, 0.12);
      atualY = lerp(atualY, alvoY, 0.12);

      heroReveal.style.setProperty("--reveal-x", `${atualX}px`);
      heroReveal.style.setProperty("--reveal-y", `${atualY}px`);

      const distancia = Math.hypot(alvoX - atualX, alvoY - atualY);
      if (distancia > 0.1) {
        requestAnimationFrame(atualizarQuadro);
      } else {
        animando = false;
      }
    };

    const iniciarAnimacao = () => {
      if (!animando) {
        animando = true;
        requestAnimationFrame(atualizarQuadro);
      }
    };

    heroSection.addEventListener("mousemove", (evento) => {
      const rect = heroSection.getBoundingClientRect();
      alvoX = evento.clientX - rect.left;
      alvoY = evento.clientY - rect.top;
      iniciarAnimacao();
    });

    heroSection.addEventListener("mouseenter", () => {
      heroReveal.classList.add("is-active");
    });

    heroSection.addEventListener("mouseleave", () => {
      heroReveal.classList.remove("is-active");
    });
  }

  // ---------------------------------------------------------
  // Revelação suave da seção "Quem Somos" ao rolar a página.
  // Usa IntersectionObserver (leve, não bloqueia o scroll por
  // toque) e respeita a preferência de movimento reduzido.
  // ---------------------------------------------------------
  const secaoSobre = document.querySelector(".about");
  const prefereMovimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (secaoSobre && "IntersectionObserver" in window && !prefereMovimentoReduzido) {
    secaoSobre.classList.add("is-ready");

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            secaoSobre.classList.add("is-visible");
            observador.unobserve(secaoSobre);
          }
        });
      },
      { threshold: 0.2 }
    );

    observador.observe(secaoSobre);
  }

  // ---------------------------------------------------------
  // Navegação fixa ao rolar (desktop: header inteiro;
  // mobile: apenas o botão hambúrguer). Usa uma classe de
  // estado ("is-scrolled") controlada via requestAnimationFrame
  // para manter a rolagem leve e sem travamentos.
  // ---------------------------------------------------------
  const header = document.querySelector(".hero__header");
  const limiarRolagem = 40;
  let aguardandoQuadro = false;

  if (header && navToggle) {
    const atualizarEstadoRolagem = () => {
      const rolou = window.scrollY > limiarRolagem;
      header.classList.toggle("is-scrolled", rolou);
      navToggle.classList.toggle("is-scrolled", rolou);
      aguardandoQuadro = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!aguardandoQuadro) {
          aguardandoQuadro = true;
          requestAnimationFrame(atualizarEstadoRolagem);
        }
      },
      { passive: true }
    );

    // Garante o estado correto caso a página carregue já rolada.
    atualizarEstadoRolagem();
  }

  // ---------------------------------------------------------
  // Carrossel 3D infinito — seção "Cultos"
  // Os cartões reais no DOM são poucos (um por culto), mas o
  // carrossel se comporta como um loop infinito porque a posição
  // de cada cartão é calculada pela DISTÂNCIA CIRCULAR até o
  // cartão ativo (módulo do total de cartões), e não por uma
  // lista fixa. Isso elimina qualquer "salto" visual ao repetir.
  // ---------------------------------------------------------
  const cultosTrack = document.getElementById("cultosTrack");
  const cultosPrevBtn = document.getElementById("cultosPrev");
  const cultosNextBtn = document.getElementById("cultosNext");

  if (cultosTrack && cultosPrevBtn && cultosNextBtn) {
    const cartoesCultos = Array.from(cultosTrack.querySelectorAll(".cultos__card"));
    const totalCultos = cartoesCultos.length;
    let cultoAtivo = 0;
    let arrastoXCultos = 0;

    const prefereMovimentoReduzidoCultos = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Menor distância entre dois índices, tratando a lista como um
    // círculo (ex.: com 3 cartões, o próximo depois do último é o 0).
    const distanciaCircular = (indice, referencia, total) => {
      let diferenca = (indice - referencia) % total;
      if (diferenca > total / 2) diferenca -= total;
      if (diferenca < -total / 2) diferenca += total;
      return diferenca;
    };

    const obterParametrosCultos = () => {
      const largura = window.innerWidth;
      if (largura <= 560) {
        return { espaco: 140, angulo: 20, passoEscala: 0.24, passoOpacidade: 0.6, profundidade: 90, offsetMaximo: 1 };
      }
      if (largura <= 860) {
        return { espaco: 180, angulo: 26, passoEscala: 0.18, passoOpacidade: 0.48, profundidade: 110, offsetMaximo: 2 };
      }
      return { espaco: 230, angulo: 32, passoEscala: 0.14, passoOpacidade: 0.35, profundidade: 140, offsetMaximo: 2 };
    };

    const posicionarCartoesCultos = () => {
      const { espaco, angulo, passoEscala, passoOpacidade, profundidade, offsetMaximo } =
        obterParametrosCultos();

      cartoesCultos.forEach((cartao, indice) => {
        const offset = distanciaCircular(indice, cultoAtivo, totalCultos);
        const offsetAbs = Math.abs(offset);
        const emHover = cartao.classList.contains("is-hover");

        const x = offset * espaco + arrastoXCultos;
        let rotacaoY = prefereMovimentoReduzidoCultos ? 0 : -offset * angulo;
        let escala = Math.max(1 - offsetAbs * passoEscala, 0.5);
        const profundidadeZ = prefereMovimentoReduzidoCultos ? 0 : -offsetAbs * profundidade;

        // No hover, achata parcialmente cartões vizinhos para
        // manter a informação revelada legível.
        if (emHover && offset !== 0) {
          rotacaoY *= 0.35;
          escala = Math.min(escala + 0.06, 1);
        }

        const opacidade = offsetAbs > offsetMaximo ? 0 : Math.max(1 - offsetAbs * passoOpacidade, 0);

        cartao.style.transform = `translate3d(${x}px, 0, ${profundidadeZ}px) rotateY(${rotacaoY}deg) scale(${escala})`;
        cartao.style.opacity = String(opacidade);
        cartao.style.zIndex = emHover ? "150" : String(100 - offsetAbs);
        cartao.style.pointerEvents = opacidade === 0 ? "none" : "auto";
      });
    };

    const irParaCulto = (indice) => {
      cultoAtivo = ((indice % totalCultos) + totalCultos) % totalCultos;
      posicionarCartoesCultos();
    };

    const proximoCulto = () => irParaCulto(cultoAtivo + 1);
    const cultoAnterior = () => irParaCulto(cultoAtivo - 1);

    cultosNextBtn.addEventListener("click", proximoCulto);
    cultosPrevBtn.addEventListener("click", cultoAnterior);

    // Clique/toque: fixa o cartão como focado (permanece em
    // destaque mesmo depois que o mouse sai) e o centraliza.
    const focarCulto = (indice) => {
      cartoesCultos.forEach((cartao, i) => {
        const focado = i === indice;
        cartao.classList.toggle("is-focused", focado);
        cartao.setAttribute("aria-pressed", String(focado));
      });
      irParaCulto(indice);
    };

    cartoesCultos.forEach((cartao, indice) => {
      cartao.addEventListener("click", () => focarCulto(indice));

      cartao.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          focarCulto(indice);
        }
      });

      // Hover no desktop: revela as informações sem alterar
      // qual cartão está fixado como focado.
      cartao.addEventListener("mouseenter", () => {
        cartao.classList.add("is-hover");
        posicionarCartoesCultos();
      });
      cartao.addEventListener("mouseleave", () => {
        cartao.classList.remove("is-hover");
        posicionarCartoesCultos();
      });
    });

    // ---------------------------------------------------------
    // Arraste (mouse) e toque (swipe) — ambos usam a mesma lógica.
    // ---------------------------------------------------------
    let arrastandoCultos = false;
    let inicioXCultos = 0;

    const iniciarArrasteCultos = (x) => {
      arrastandoCultos = true;
      inicioXCultos = x;
      cultosTrack.classList.add("is-dragging");
    };

    const moverArrasteCultos = (x) => {
      if (!arrastandoCultos) return;
      arrastoXCultos = x - inicioXCultos;
      posicionarCartoesCultos();
    };

    const finalizarArrasteCultos = () => {
      if (!arrastandoCultos) return;
      arrastandoCultos = false;
      cultosTrack.classList.remove("is-dragging");

      const limiarArraste = 60;
      if (arrastoXCultos > limiarArraste) {
        cultoAnterior();
      } else if (arrastoXCultos < -limiarArraste) {
        proximoCulto();
      }
      arrastoXCultos = 0;
      posicionarCartoesCultos();
    };

    cultosTrack.addEventListener("mousedown", (evento) => {
      evento.preventDefault();
      iniciarArrasteCultos(evento.clientX);
    });
    window.addEventListener("mousemove", (evento) => moverArrasteCultos(evento.clientX));
    window.addEventListener("mouseup", finalizarArrasteCultos);

    cultosTrack.addEventListener(
      "touchstart",
      (evento) => iniciarArrasteCultos(evento.touches[0].clientX),
      { passive: true }
    );
    cultosTrack.addEventListener(
      "touchmove",
      (evento) => moverArrasteCultos(evento.touches[0].clientX),
      { passive: true }
    );
    cultosTrack.addEventListener("touchend", finalizarArrasteCultos);

    window.addEventListener("resize", posicionarCartoesCultos);

    posicionarCartoesCultos();
  }

  // ---------------------------------------------------------
  // Linha 3D de rolagem — seção "Ministérios"
  // A barra de progresso e o "farol" avançam conforme a posição
  // de rolagem; o ministério ativo é sempre o último cujo centro
  // já cruzou o centro da tela — por isso a ativação acompanha a
  // linha suavemente, um ministério de cada vez.
  // ---------------------------------------------------------
  const ministeriosTimeline = document.getElementById("ministeriosTimeline");
  const ministeriosProgress = document.getElementById("ministeriosProgress");
  const ministeriosHead = document.getElementById("ministeriosHead");

  if (ministeriosTimeline && ministeriosProgress) {
    const itensMinisterios = Array.from(
      ministeriosTimeline.querySelectorAll(".ministerios__item")
    );
    let quadroAgendadoMinisterios = false;

    const atualizarMinisterios = () => {
      quadroAgendadoMinisterios = false;

      const rect = ministeriosTimeline.getBoundingClientRect();
      const centroViewport = window.innerHeight / 2;

      // Progresso de 0 a 1: o quanto a trilha já avançou entre o
      // topo e a base da seção, tomando como referência o centro
      // da tela.
      const progresso = Math.min(
        Math.max((centroViewport - rect.top) / rect.height, 0),
        1
      );

      ministeriosProgress.style.height = `${progresso * 100}%`;

      if (ministeriosHead) {
        ministeriosHead.style.top = `${progresso * 100}%`;
        ministeriosHead.style.opacity = progresso > 0 && progresso < 1 ? "1" : "0";
      }

      let indiceAtivo = 0;
      itensMinisterios.forEach((item, indice) => {
        const itemRect = item.getBoundingClientRect();
        const centroItem = itemRect.top + itemRect.height / 2;
        if (centroItem <= centroViewport) {
          indiceAtivo = indice;
        }
      });

      itensMinisterios.forEach((item, indice) => {
        item.classList.toggle("is-active", indice === indiceAtivo);
      });
    };

    const agendarAtualizacaoMinisterios = () => {
      if (!quadroAgendadoMinisterios) {
        quadroAgendadoMinisterios = true;
        requestAnimationFrame(atualizarMinisterios);
      }
    };

    window.addEventListener("scroll", agendarAtualizacaoMinisterios, { passive: true });
    window.addEventListener("resize", agendarAtualizacaoMinisterios);

    atualizarMinisterios();
  }

  // ---------------------------------------------------------
  // Animação de entrada do cartão do pastor — seção "Liderança".
  // Mesmo padrão usado em "Quem Somos": puramente aditivo (some
  // sem JS) e respeita a preferência de movimento reduzido.
  // ---------------------------------------------------------
  const cartaoLideranca = document.getElementById("liderancaCard");

  if (cartaoLideranca && "IntersectionObserver" in window && !prefereMovimentoReduzido) {
    cartaoLideranca.classList.add("is-ready");

    const observadorLideranca = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            cartaoLideranca.classList.add("is-visible");
            observadorLideranca.unobserve(cartaoLideranca);
          }
        });
      },
      { threshold: 0.2 }
    );

    observadorLideranca.observe(cartaoLideranca);
  }

  // ---------------------------------------------------------
  // Seção "Redes" — entrada do bloco do YouTube (vídeo de um
  // lado, texto do outro) e revelação escalonada dos ícones de
  // redes sociais. Mesmo padrão aditivo das demais seções.
  // ---------------------------------------------------------
  const redesVideoWrap = document.getElementById("redesVideoWrap");
  const redesTextWrap = document.getElementById("redesTextWrap");
  const redesSocialList = document.getElementById("redesSocialList");

  if ("IntersectionObserver" in window && !prefereMovimentoReduzido) {
    if (redesVideoWrap && redesTextWrap) {
      redesVideoWrap.classList.add("is-ready");
      redesTextWrap.classList.add("is-ready");

      const observadorRedesYoutube = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              redesVideoWrap.classList.add("is-visible");
              redesTextWrap.classList.add("is-visible");
              observadorRedesYoutube.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );

      observadorRedesYoutube.observe(redesVideoWrap);
    }

    if (redesSocialList) {
      redesSocialList.classList.add("is-ready");

      const observadorRedesSocial = new IntersectionObserver(
        (entradas) => {
          entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
              redesSocialList.classList.add("is-visible");
              observadorRedesSocial.unobserve(redesSocialList);
            }
          });
        },
        { threshold: 0.2 }
      );

      observadorRedesSocial.observe(redesSocialList);
    }
  }

  // Links de WhatsApp e Facebook ainda não têm URL definitiva:
  // evita que o clique recarregue a página no próprio link vazio.
  document.querySelectorAll(".redes__social-link.is-em-breve, .footer__social-link.is-em-breve").forEach((link) => {
    link.addEventListener("click", (evento) => evento.preventDefault());
  });

  // ---------------------------------------------------------
  // Seção "Contatos" — os dois cartões (igreja e mapa) entram
  // de lados opostos, no mesmo padrão cinematográfico usado nas
  // demais seções.
  // ---------------------------------------------------------
  const contatoCardIgreja = document.getElementById("contatoCardIgreja");
  const contatoCardMapa = document.getElementById("contatoCardMapa");

  if (contatoCardIgreja && contatoCardMapa && "IntersectionObserver" in window && !prefereMovimentoReduzido) {
    contatoCardIgreja.classList.add("is-ready");
    contatoCardMapa.classList.add("is-ready");

    const observadorContato = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            contatoCardIgreja.classList.add("is-visible");
            contatoCardMapa.classList.add("is-visible");
            observadorContato.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    observadorContato.observe(contatoCardIgreja);
  }

  // ---------------------------------------------------------
  // Hero — indicador lateral das Cinco Solas: destaca uma de
  // cada vez, de forma lenta e discreta, sem interação do
  // usuário. Respeita preferência por movimento reduzido.
  // ---------------------------------------------------------
  const solas = document.querySelectorAll(".hero__sola");

  if (solas.length && !prefereMovimentoReduzido) {
    let indiceSolaAtiva = 0;

    setInterval(() => {
      solas[indiceSolaAtiva].classList.remove("is-active");
      indiceSolaAtiva = (indiceSolaAtiva + 1) % solas.length;
      solas[indiceSolaAtiva].classList.add("is-active");
    }, 3200);
  }
});
