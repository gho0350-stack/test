import heavenlyStems from '@data/heavenly_stems.json';
import earthlyBranches from '@data/earthly_branches.json';
import dayPillars from '@data/day_pillars.json';
import fiveElements from '@data/five_elements.json';
import tenGods from '@data/ten_gods.json';
import branchRelations from '@data/branch_relations.json';
import destinyCards from '@data/destiny_cards.json';
import tarotCards from '@data/tarot_cards.json';
import pastLives from '@data/past_life_archetypes.json';
import wealthRules from '@data/wealth_rules.json';
import careerRules from '@data/career_rules.json';
import relationshipRules from '@data/relationship_rules.json';
import cycleRules from '@data/fortune_cycle_rules.json';
import maps from '@data/game_maps.json';
import buildings from '@data/game_buildings.json';
import npcs from '@data/game_npcs.json';
import quests from '@data/quests.json';
import products from '@data/products.json';
import costs from '@data/consult_costs.json';

export const C = {
  heavenlyStems, earthlyBranches, dayPillars, fiveElements, tenGods, branchRelations, destinyCards, tarotCards, pastLives,
  rules: { wealth: wealthRules, career: careerRules, relationship: relationshipRules, fortune: cycleRules } as Record<string, any[]>,
  maps, buildings, npcs, quests, products, costs,
};
export type Npc = (typeof npcs)[number];
export type Product = (typeof products)[number];
