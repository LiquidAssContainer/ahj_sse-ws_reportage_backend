module.exports = [
  {
    type: 'start',
    message: 'Игра начинается! О-о-очень интересно!',
    chance: 0,
  },
  {
    type: 'action',
    message: 'Идёт перемещение мяча по полю, игроки и той, и другой команды активно пытаются атаковать',
    chance: 50,
  },
  {
    type: 'freekick',
    message: 'Нарушение правил, будет штрафной удар',
    chance: 40,
  },
  {
    type: 'goal',
    message: 'Отличный удар! И Г-О-Л!',
    chance: 10,
  },
];
