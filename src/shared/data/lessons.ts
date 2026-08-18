/**
 * 课程数据
 */
import type { Lesson } from '../lib/types';

export const LESSONS: Lesson[] = [
  // Level 1: 左手 Home Row
  {
    id: 'l1-1',
    level: 1,
    title: '左手 Home Row - 基础',
    description: '练习左手在 Home Row 上的位置：A S D F',
    text: 'aa ss dd ff as df sa fd ad sf da',
  },
  {
    id: 'l1-2',
    level: 1,
    title: '左手 Home Row - 简单词',
    description: '用 Home Row 字母组成简单单词',
    text: 'sad dad add far as if is sad dad add far as if is sad',
  },
  {
    id: 'l1-3',
    level: 1,
    title: '左手 Home Row - 短句',
    description: '用 Home Row 字母练习短句',
    text: 'dad has a red fan and a sad cat as dad add far as dad had a far sad',
  },
  {
    id: 'l1-4',
    level: 1,
    title: '左手 Home Row - 综合',
    description: '综合练习左手 Home Row',
    text: 'dad had a sad cat a red fan far sad add dad as if is dad add far sad dad had a red fan and a sad cat',
  },
  {
    id: 'l1-5',
    level: 1,
    title: '左手 Home Row - 挑战',
    description: '挑战左手 Home Row 长文',
    text: 'dad had a sad cat a red fan far sad add dad as if is dad add far sad dad had a red fan and a sad cat a red fan far sad dad add dad as if is dad',
  },

  // Level 2: 右手 Home Row
  {
    id: 'l2-1',
    level: 2,
    title: '右手 Home Row - 基础',
    description: '练习右手在 Home Row 上的位置：J K L ;',
    text: 'jj kk ll ;; jk lj kj lj jk lj kj lj jk',
  },
  {
    id: 'l2-2',
    level: 2,
    title: '右手 Home Row - 简单词',
    description: '用 Home Row 字母组成简单单词',
    text: 'job kid ill sill Jill will fill kill bill Jill will fill kill bill',
  },
  {
    id: 'l2-3',
    level: 2,
    title: '右手 Home Row - 短句',
    description: '用 Home Row 字母练习短句',
    text: 'Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill',
  },
  {
    id: 'l2-4',
    level: 2,
    title: '右手 Home Row - 综合',
    description: '综合练习右手 Home Row',
    text: 'Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill',
  },
  {
    id: 'l2-5',
    level: 2,
    title: '右手 Home Row - 挑战',
    description: '挑战右手 Home Row 长文',
    text: 'Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill Jill will fill kill bill',
  },

  // Level 3: 左手上下行
  {
    id: 'l3-1',
    level: 3,
    title: '左手上下行 - 基础',
    description: '练习左手所有键：Q W E R T Y U I O P Z X C V B',
    text: 'qwerty uiop zxcvb qwerty uiop zxcvb qwerty',
  },
  {
    id: 'l3-2',
    level: 3,
    title: '左手上下行 - 词组',
    description: '左手上下行字母组成词组',
    text: 'tree rest wet red very best test web vet web vet rest',
  },
  {
    id: 'l3-3',
    level: 3,
    title: '左手上下行 - 短句',
    description: '左手上下行字母练习短句',
    text: 'the red bird very best web vet rest tree rest wet red very best',
  },
  {
    id: 'l3-4',
    level: 3,
    title: '左手上下行 - 综合',
    description: '左手上下行字母综合练习',
    text: 'the red bird very best web vet rest tree rest wet red very best the red bird very best web vet rest',
  },

  // Level 4: 右手上下行
  {
    id: 'l4-1',
    level: 4,
    title: '右手上下行 - 基础',
    description: '练习右手所有键：Y U I O P N M , . /',
    text: 'yuiop nm,. yuiop nm,. yuiop',
  },
  {
    id: 'l4-2',
    level: 4,
    title: '右手上下行 - 词组',
    description: '右手上下行字母组成词组',
    text: 'you run may man my up on now our our our run may man',
  },
  {
    id: 'l4-3',
    level: 4,
    title: '右手上下行 - 短句',
    description: '右手上下行字母练习短句',
    text: 'you run may man my up on now our our run may man you run may man',
  },
  {
    id: 'l4-4',
    level: 4,
    title: '右手上下行 - 综合',
    description: '右手上下行字母综合练习',
    text: 'you run may man my up on now our our run may man you run may man you run may man',
  },

  // Level 5: 全键盘
  {
    id: 'l5-1',
    level: 5,
    title: '全键盘 - 基础词',
    description: '使用所有字母键的简单单词',
    text: 'hello world banana apple orange hello world banana apple orange',
  },
  {
    id: 'l5-2',
    level: 5,
    title: '全键盘 - 常用词',
    description: '常用英文单词练习',
    text: 'the quick brown fox jumps over the lazy dog the quick brown fox jumps over the lazy dog',
  },
  {
    id: 'l5-3',
    level: 5,
    title: '全键盘 - 短文',
    description: '常用英文短文练习',
    text: 'the quick brown fox jumps over the lazy dog. a fox jumped over the lazy dog. the brown fox is quick.',
  },
  {
    id: 'l5-4',
    level: 5,
    title: '全键盘 - 综合',
    description: '全键盘综合练习',
    text: 'the quick brown fox jumps over the lazy dog. a fox jumped over the lazy dog. the brown fox is quick. the fox is brown and quick.',
  },

  // Level 6: 数字和符号
  {
    id: 'l6-1',
    level: 6,
    title: '数字练习',
    description: '练习数字键 0-9',
    text: '1234567890 0987654321 1234567890 0987654321 1234567890',
  },
  {
    id: 'l6-2',
    level: 6,
    title: '符号练习',
    description: '练习符号键 ! @ # $ % ^ & * ( )',
    text: '!@#$%^&*() !@#$%^&*() !@#$%^&*()',
  },
  {
    id: 'l6-3',
    level: 6,
    title: '综合符号',
    description: '数字和符号混合练习',
    text: 'hello123 world456 test789 hello world 123 456 789 test ok 100 200 300',
  },
];

/** 按 Level 分组的课程 */
export function getLessonsByLevel(level: number): Lesson[] {
  return LESSONS.filter((l) => l.level === level);
}

/** 所有课程 */
export function getAllLessons(): Lesson[] {
  return LESSONS;
}
