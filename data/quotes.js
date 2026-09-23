// Curated Inspirational Quotes on Reading, Books, Libraries & Knowledge
const quotes = [
  {
    quote: "Google can bring you back 100,000 answers. A librarian can bring you back the right one.",
    author: "Neil Gaiman"
  },
  {
    quote: "When in doubt go to the library.",
    author: "J.K. Rowling"
  },
  {
    quote: "A room without books is like a body without a soul.",
    author: "Marcus Tullius Cicero"
  },
  {
    quote: "The only thing that you absolutely have to know, is the location of the library.",
    author: "Albert Einstein"
  },
  {
    quote: "A library is not a luxury but one of the necessities of life.",
    author: "Henry Ward Beecher"
  },
  {
    quote: "Libraries store the energy that fuels the imagination. They open up windows to the world and inspire us to explore and achieve.",
    author: "Sidney Sheldon"
  },
  {
    quote: "I have always imagined that Paradise will be a kind of library.",
    author: "Jorge Luis Borges"
  },
  {
    quote: "A reader lives a thousand lives before he dies. The man who never reads lives only one.",
    author: "George R.R. Martin"
  },
  {
    quote: "Today a reader, tomorrow a leader.",
    author: "Margaret Fuller"
  },
  {
    quote: "There is no friend as loyal as a book.",
    author: "Ernest Hemingway"
  },
  {
    quote: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    author: "Dr. Seuss"
  },
  {
    quote: "Books are a uniquely portable magic.",
    author: "Stephen King"
  },
  {
    quote: "Reading is essential for those who seek to rise above the ordinary.",
    author: "Jim Rohn"
  },
  {
    quote: "A library is the delivery room for the birth of ideas, a place where history comes to life.",
    author: "Norman Cousins"
  },
  {
    quote: "Reading brings us unknown friends.",
    author: "Honoré de Balzac"
  },
  {
    quote: "To read is to fly: it is to soar to a point of vantage which gives a view over wide terrains of history, human variety, ideas, and shared experience.",
    author: "A.C. Grayling"
  },
  {
    quote: "Once you learn to read, you will be forever free.",
    author: "Frederick Douglass"
  },
  {
    quote: "You can never get a cup of tea large enough or a book long enough to suit me.",
    author: "C.S. Lewis"
  },
  {
    quote: "The reading of all good books is like conversation with the finest minds of past centuries.",
    author: "René Descartes"
  },
  {
    quote: "Books serve to show a man that those original thoughts of his aren't very new after all.",
    author: "Abraham Lincoln"
  },
  {
    quote: "One best book is equal to a hundred good friends, but one good friend is equal to a library.",
    author: "Dr. A.P.J. Abdul Kalam"
  },
  {
    quote: "Libraries are the wardrobes of literature, whence men, properly informed, might bring forth whatever was useful or ornamental to the soul.",
    author: "James Dyer"
  },
  {
    quote: "A great library does not have to be big or beautiful; it only has to be open and full of books.",
    author: "Lemony Snicket"
  },
  {
    quote: "Books give a soul to the universe, wings to the mind, flight to the imagination, and life to everything.",
    author: "Plato"
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin"
  },
  {
    quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi"
  },
  {
    quote: "The highest education is that which does not merely give us information but makes our life in harmony with all existence.",
    author: "Rabindranath Tagore"
  },
  {
    quote: "Knowledge will bring you the opportunity to make a difference.",
    author: "Claire Fagin"
  },
  {
    quote: "Libraries are the thin edge of the wedge for literacy and imagination.",
    author: "Neil Gaiman"
  },
  {
    quote: "Reading one book is like eating one potato chip.",
    author: "Diane Duane"
  },
  {
    quote: "A good library will never be too neat, or too clean, because people will always be using its books.",
    author: "Lemony Snicket"
  },
  {
    quote: "The library is an arena of possibility, opening both a window into the soul and a door onto the world.",
    author: "Rita Dove"
  },
  {
    quote: "Everything you need for a better future and success has already been written. All you have to do is go to the library.",
    author: "Henri Frederic Amiel"
  },
  {
    quote: "Nothing is pleasanter than exploring a library.",
    author: "Walter Savage Landor"
  },
  {
    quote: "Bad libraries build collections, good libraries build services, great libraries build communities.",
    author: "R. David Lankes"
  },
  {
    quote: "Cutting libraries during a recession is like cutting hospitals during a plague.",
    author: "Eleanor Crumblehulme"
  },
  {
    quote: "Librarians are the secret masters of the world. They control information.",
    author: "Spider Robinson"
  },
  {
    quote: "A library is a house of hope. It's a place where we go, to inquire in a world of silence, that the minds of the ancients may speak to us.",
    author: "Garrison Keillor"
  },
  {
    quote: "In the nonstop tsunami of global information, librarians provide us with floaties and teach us how to swim.",
    author: "Linton Weeks"
  },
  {
    quote: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela"
  }
];

function getRandomQuote(excludeIndex = -1) {
  if (quotes.length <= 1) return { quote: quotes[0], index: 0 };
  let rand;
  do {
    rand = Math.floor(Math.random() * quotes.length);
  } while (rand === excludeIndex && quotes.length > 1);
  return { ...quotes[rand], index: rand };
}

module.exports = {
  quotes,
  getRandomQuote
};
