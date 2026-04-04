import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { NotionService, buildCompletePayload } from '../services/notionService';

/**
 * Watches for newly completed quests that have a Notion page ID
 * and syncs their status back to Notion automatically.
 */
export function useNotionSync() {
  const { state } = useGame();
  const { notion, completedQuests } = state;
  const prevDoneRef = useRef(new Set());

  useEffect(() => {
    if (!notion?.connected || !notion?.token || !notion?.workerUrl) return;

    const svc = new NotionService(notion.workerUrl, notion.token);

    const newlyDone = completedQuests.filter(q => {
      if (q.status !== 'completed') return false;
      if (!q.notionPageId)         return false;
      if (prevDoneRef.current.has(q.id)) return false;
      return true;
    });

    if (newlyDone.length === 0) return;

    newlyDone.forEach(async quest => {
      prevDoneRef.current.add(quest.id);
      if (!quest.notionStatusProp || !quest.notionStatusType) return;

      // We need the db schema to build the correct payload
      // For simplicity we attempt a checkbox or status update directly
      let properties = null;
      if (quest.notionStatusType === 'checkbox') {
        properties = { [quest.notionStatusProp]: { checkbox: true } };
      } else if (quest.notionStatusType === 'status') {
        // Try common "done" names
        properties = { [quest.notionStatusProp]: { status: { name: 'Done' } } };
      } else if (quest.notionStatusType === 'select') {
        properties = { [quest.notionStatusProp]: { select: { name: 'Done' } } };
      }

      if (!properties) return;

      try {
        await svc.markPageComplete(quest.notionPageId, properties);
        console.log(`[Notion] Marked "${quest.title}" complete`);
      } catch (e) {
        console.warn(`[Notion] Could not sync "${quest.title}":`, e.message);
      }
    });
  }, [completedQuests, notion]);
}
