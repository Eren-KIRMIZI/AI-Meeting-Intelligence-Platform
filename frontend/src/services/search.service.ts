import { buildSearchIndex, searchWorkspace as rank } from '@/lib/search';
import type { SearchFilters, SearchResult } from '@/types';
import { listDecisions } from './decisions.service';
import { listKnowledge } from './knowledge.service';
import { listMeetings } from './meetings.service';
import { listProjects } from './projects.service';
import { listTasks } from './tasks.service';
import { listTeam } from './team.service';

/**
 * Loads the workspace entities that feed the search index. The workspace is
 * small enough that an in-memory index is faster and simpler than a server
 * query; the index is rebuilt per search and ranked locally.
 */
export async function searchWorkspace(
  orgId: string | null,
  filters: SearchFilters
): Promise<SearchResult[]> {
  const [meetings, tasks, decisions, knowledge, projects, team] =
    await Promise.all([
      listMeetings(orgId),
      listTasks(orgId),
      listDecisions(orgId),
      listKnowledge(orgId),
      listProjects(orgId),
      listTeam(orgId),
    ]);

  return rank(
    buildSearchIndex({ meetings, tasks, decisions, knowledge, projects, team }),
    filters
  );
}
