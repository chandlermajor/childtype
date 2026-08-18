/**
 * 键盘布局数据 / Keyboard Layout Data
 * @module data/keyboard-layouts
 */

const layouts = {
  QWERTY: {
    name: 'QWERTY',
    nameEn: 'QWERTY',
    rows: [
      ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Space']
    ],
    fingerMap: {
      '`': 'left-pinky', '1': 'left-pinky', 'q': 'left-pinky', 'a': 'left-pinky', 'z': 'left-pinky',
      '2': 'left-ring', 'w': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
      '3': 'left-middle', 'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
      '4': 'left-index', '5': 'left-index', 'r': 'left-index', 't': 'left-index', 'f': 'left-index', 'g': 'left-index',
      '6': 'right-index', '7': 'right-index', 'y': 'right-index', 'u': 'right-index', 'h': 'right-index', 'j': 'right-index',
      '8': 'right-middle', 'i': 'right-middle', 'k': 'right-middle',
      '9': 'right-ring', 'o': 'right-ring', 'l': 'right-ring',
      '0': 'right-pinky', 'p': 'right-pinky', ';': 'right-pinky', "'": 'right-pinky', '\\': 'right-pinky', '/': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky', ']': 'right-pinky', '[': 'right-pinky', ',': 'right-pinky', '.': 'right-pinky'
    }
  },
  AZERTY: {
    name: 'AZERTY',
    nameEn: 'AZERTY',
    rows: [
      ['&', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
      ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '^', '$', '`],
      ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'ù', '*', '\\'],
      ['w', 'x', 'c', 'v', 'b', 'n', ',', ';', ':', '!', '?', 'Enter']
    ],
    fingerMap: {
      '&': 'left-pinky', '1': 'left-pinky', 'a': 'left-pinky', 'q': 'left-pinky', 'w': 'left-pinky',
      '2': 'left-ring', 'z': 'left-ring', 's': 'left-ring', 'x': 'left-ring',
      '3': 'left-middle', 'e': 'left-middle', 'd': 'left-middle', 'c': 'left-middle',
      '4': 'left-index', '5': 'left-index', 'r': 'left-index', 't': 'left-index', 'f': 'left-index', 'g': 'left-index', 'v': 'left-index', 'b': 'left-index',
      '6': 'right-index', 'y': 'right-index', 'u': 'right-index', 'h': 'right-index', 'j': 'right-index', 'n': 'right-index',
      '7': 'right-middle', 'i': 'right-middle', 'k': 'right-middle',
      '8': 'right-ring', 'o': 'right-ring', 'l': 'right-ring',
      '9': 'right-pinky', 'p': 'right-pinky', 'm': 'right-pinky', 'ù': 'right-pinky', '^': 'right-pinky', '$': 'right-pinky', '`': 'right-pinky', '*': 'right-pinky', '\\': 'right-pinky', ',': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky', '!': 'right-pinky', '?': 'right-pinky', '-': 'right-pinky', '=': 'right-pinky'
    }
  }
};

export default layouts;
