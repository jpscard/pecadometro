export interface Sin {
  id: string;
  name: string;
  description: string;
  category: 'Vícios' | 'Atitude' | 'Relacionamento' | 'Religiosidade' | 'Moral' | 'Geral';
}

export const SINS: Sin[] = [
  // Vícios
  { id: '1', name: 'Glutonaria', category: 'Vícios', description: 'Aquele terceiro prato no rodízio que você disse que não comeria.' },
  { id: '2', name: 'Drogas', category: 'Vícios', description: 'Química perigosa que não é a do seu perfume favorito.' },
  { id: '3', name: 'Vício do Cigarro', category: 'Vícios', description: 'Transformando seu pulmão numa chaminé de locomotiva a vapor.' },
  { id: '4', name: 'Vício do Álcool', category: 'Vícios', description: 'Aquele "golinho" que virou uma amnésia no dia anterior.' },
  { id: '5', name: 'Jogos de Azar', category: 'Vícios', description: 'Apostando o VR no jogo do bicho ou no tigrinho.' },
  { id: '6', name: 'Pornografia', category: 'Vícios', description: 'Perdendo tempo em sites que não ensinam receitas de bolo.' },
  { id: '7', name: 'Consumismo', category: 'Vícios', description: 'Comprando coisas que não precisa com dinheiro que não tem.' },

  // Atitude
  { id: '8', name: 'Arrogante', category: 'Atitude', description: 'Se achando a última bolacha (recheada) do pacote.' },
  { id: '9', name: 'Autoritário', category: 'Atitude', description: 'O pequeno ditador que habita em você querendo mandar em tudo.' },
  { id: '10', name: 'Orgulho/Soberba', category: 'Atitude', description: 'Você é tão incrível que nem deveria estar marcando esse item, né?' },
  { id: '11', name: 'Preguiça', category: 'Atitude', description: 'Campeão mundial de "só mais 5 minutinhos" no despertador.' },
  { id: '12', name: 'Vaidade', category: 'Atitude', description: 'Passando mais tempo no espelho do que no trabalho.' },
  { id: '13', name: 'Hipócrita', category: 'Atitude', description: 'Cobrando dos outros o que você mesmo não faz nem por decreto.' },
  { id: '14', name: 'Inveja', category: 'Atitude', description: 'De olho no gramado do vizinho que parece sempre mais verde.' },
  { id: '15', name: 'Mania de Doença', category: 'Atitude', description: 'O famoso hipocondríaco que faz o Google virar médico.' },

  // Relacionamento
  { id: '16', name: 'Adultério', category: 'Relacionamento', description: 'Pecando contra o contrato sagrado do "até que a morte nos separe".' },
  { id: '17', name: 'Briguento', category: 'Relacionamento', description: 'Procurando confusão até em fila de padaria por causa de troco.' },
  { id: '18', name: 'Ciúme Doentio', category: 'Relacionamento', description: 'Investigando o "like" que a pessoa deu na foto do pet de 2012.' },
  { id: '19', name: 'Caluniador', category: 'Relacionamento', description: 'O serviço de fofoca 24h que ninguém pediu para assinar.' },
  { id: '20', name: 'Ódio', category: 'Relacionamento', description: 'Guardando veneno no coração esperando o outro passar mal.' },
  { id: '21', name: 'Traição', category: 'Relacionamento', description: 'Dando aquela facada nas costas de quem confiou em você.' },
  { id: '22', name: 'Maledicente', category: 'Relacionamento', description: 'Falar mal dos outros: seu esporte olímpico favorito.' },

  // Religiosidade
  { id: '23', name: 'Feitiçaria', category: 'Religiosidade', description: 'Tentando atalhos espirituais que não estão na Bíblia.' },
  { id: '24', name: 'Idolatria', category: 'Religiosidade', description: 'Colocando qualquer coisa (ou pessoa) no trono do seu coração.' },
  { id: '25', name: 'Incredulidade', category: 'Religiosidade', description: 'Duvidando de tudo até quando o milagre está na sua cara.' },
  { id: '26', name: 'Horóscopo', category: 'Religiosidade', description: 'Achei que meu signo hoje dizia que eu não ia pecar.' },
  { id: '27', name: 'Pacto Satânico', category: 'Religiosidade', description: 'Assinando contratos que não têm cláusula de rescisão fácil.' },

  // Moral
  { id: '28', name: 'Enganador', category: 'Moral', description: 'A arte de omitir a verdade para levar vantagem.' },
  { id: '29', name: 'Ladrão', category: 'Moral', description: 'O que é seu é seu, o que é dos outros... também?' },
  { id: '30', name: 'Mentira', category: 'Moral', description: 'A famosa "mentirinha branca" que já está cinza de tanto uso.' },
  { id: '31', name: 'Palavrões', category: 'Moral', description: 'Seu vocabulário de marinheiro em dia de tempestade.' },
  { id: '32', name: 'Pirataria', category: 'Moral', description: 'Navegando nos sete mares do Torrent para não pagar o streaming.' },
  { id: '33', name: 'Suborno', category: 'Moral', description: 'O famoso "jeitinho brasileiro" levado ao extremo ilegal.' },

  // Geral / Outros (Exemplos rápidos)
  { id: '34', name: 'Negligência', category: 'Geral', description: 'Deixando as coisas importantes para o "eu do futuro" resolver.' },
  { id: '35', name: 'Acomodado', category: 'Atitude', description: 'Na zona de conforto, onde nada cresce (nem você).' },
  { id: '36', name: 'Enganador', category: 'Moral', description: 'Prometeu e não cumpriu? Achou que ninguém ia notar?' },
  { id: '37', name: 'Egoísmo', category: 'Atitude', description: 'Primeiro eu, segundo eu, e se sobrar, eu de novo.' }
];
