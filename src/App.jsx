import { useGame } from './context/GameContext';
import CharacterCreation from './components/character/CharacterCreation';
import BookLayout from './components/layout/BookLayout';
import LevelUp from './components/ui/LevelUp';
import Notification from './components/ui/Notification';
import RewardChest from './components/rewards/RewardChest';
import { FloatingDust } from './components/ui/Particles';

export default function App() {
  const { state } = useGame();

  return (
    <>
      <FloatingDust />

      {state.screen === 'creation' ? (
        <CharacterCreation />
      ) : (
        <BookLayout />
      )}

      {/* Global overlays */}
      <LevelUp />
      <RewardChest />
      <Notification />
    </>
  );
}
