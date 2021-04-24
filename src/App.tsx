import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { Direction, generateMaze } from 'generate-maze-ts';
import bridge, { VKBridgeSubscribeHandler } from '@vkontakte/vk-bridge';

const Wrapper = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

interface Size {
  height: number;
  width: number;
}

interface Pos {
  x: number;
  y: number;
}

const Field = styled.div<Size>`
  position: relative;
  display: grid;
  grid-template-rows: repeat(
    ${({ height }) => height},
    ${({ width }) => `calc(100vw / ${width})`}
  );
  grid-template-columns: repeat(
    ${({ width }) => width},
    ${({ width }) => `calc(100vw / ${width})`}
  );
`;

type Directions = {
  left: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
};

const Cell = styled.div<Size & Pos & Directions>`
  grid-column: ${({ x, width }) => Math.min(x + 1, width)};
  grid-row: ${({ y, height }) => Math.min(y + 1, height)};
  border-top: 2px solid ${({ top }) => (top ? 'white' : 'black')};
  border-right: 2px solid ${({ right }) => (right ? 'white' : 'black')};
  border-bottom: 2px solid ${({ bottom }) => (bottom ? 'white' : 'black')};
  border-left: 2px solid ${({ left }) => (left ? 'white' : 'black')};
`;

const Character = styled.div<Pos & Size>`
  grid-column: ${({ x, width }) => Math.min(x + 1, width)};
  grid-row: ${({ y, height }) => Math.min(y + 1, height)};
  display: flex;
  justify-content: center;
  align-items: center;

  &::before {
    content: ' ';
    height: 50%;
    width: 50%;
    border-radius: 100%;
    background-color: red;
  }
`;

const height = 10;
const width = 10;

export const App: FC = () => {
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

  const maze = useMemo(() => generateMaze(width, height), []);
  const mazeRef = useRef(maze);
  mazeRef.current = maze;

  console.log('maze', maze);

  const [log, setLog] = useState('');

  useEffect(() => {
    bridge
      .send('VKWebAppGyroscopeStart', ({ refresh_rate: 500 } as unknown) as any)
      .catch(console.error);
    const handler: VKBridgeSubscribeHandler = (event) => {
      switch (event.detail.type) {
        case 'VKWebAppGyroscopeChanged':
          const x = parseFloat(event.detail.data.y);
          const y = parseFloat(event.detail.data.x);

          const absX = Math.abs(x);
          const absY = Math.abs(y);

          if (absX >= 0.4 || absY >= 0.4) {
            setLog(`x: ${x} y:${y}`);
            const pos = posRef.current;
            let posX = pos.x;
            let posY = pos.y;

            const cell = mazeRef.current[pos.y][pos.x];

            if (absX > absY) {
              if (x > 0 && !cell[Direction.right]) posX++;
              else if (x < 0 && !cell[Direction.left]) posX--;
            } else {
              if (y < 0 && !cell[Direction.top]) posY--;
              else if (y > 0 && !cell[Direction.bottom]) posY++;
            }

            if (posY < 0) posY = 0;
            if (posY >= height) posY = height - 1;

            if (posX < 0) posX = 0;
            if (posX >= width) posX = width - 1;

            setPos({
              x: posX,
              y: posY,
            });
          }
      }
    };

    bridge.subscribe(handler);

    return () => bridge.unsubscribe(handler);
  }, [setPos, mazeRef, posRef]);

  return (
    <Wrapper>
      <Field height={height} width={width}>
        {maze.map((row) =>
          row.map((cell) => (
            <Cell
              key={`${cell.y}${cell.x}`}
              height={height}
              width={width}
              {...cell}
            />
          )),
        )}
        <Character {...pos} height={height} width={width} />
      </Field>
      <p style={{ color: 'white' }}>{log}</p>
    </Wrapper>
  );
};
