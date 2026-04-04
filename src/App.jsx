import { useGame } from './context/GameContext';
import CharacterCreation from './components/character/CharacterCreation';
import BookLayout from './components/layout/BookLayout';
import LevelUp from './components/ui/LevelUp';
import Notification from './components/ui/Notification';
import RewardChest from './components/rewards/RewardChest';
import { FloatingDust } from './components/ui/Particles';
import { useNotionSync } from './hooks/useNotionSync';

export default function App() {
  const { state } = useGame();
  useNotionSync(); // silently syncs completed quests back to Notion

  return (
    <>
      <FloatingDust />
      {state.screen === 'creation' ? <CharacterCreation /> : <BookLayout />}
      <LevelUp />
      <RewardChest />
      <Notification />
    </>
  );
}
