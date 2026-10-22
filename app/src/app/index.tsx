import type { CourseBundle, Stage } from '@linguasea/contract';
import { currentStreak, dayKey, dueItems, nodeAccess, STUDY_MINUTES, unitTestId, type PathNode } from '@linguasea/core';
import { Redirect, router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, SectionList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Loading } from '@/components/loading';
import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiEnabled } from '@/lib/api';
import { courseMap, currentStage, NODE_ICON, nextLesson, nodeTitle, type StageRow, type UnitRow } from '@/lib/course-map';
import { useApp } from '@/state/app-state';

type T = (key: string, params?: Record<string, string | number>) => string;

function openNode(node: PathNode, access: string) {
  if (access === 'premium') router.push('/paywall');
  else if (access === 'open') router.push({ pathname: '/lesson/[id]', params: { id: node.id } });
}

/**
 * The course map: stages (collapsible; the current one open) → unit cards → lessons, readers,
 * practice sessions and the unit test. A virtualized list, so ~100 units per course stay fast.
 */
export default function Home() {
  const { target, course, premium, progress, t } = useApp();
  const c = useTheme();
  // Stages the learner opened or closed; the others follow "current stage open".
  const [expanded, setExpanded] = useState<Partial<Record<Stage, boolean>>>({});
  if (!target) return <Redirect href="/languages" />;
  if (!course) return <Loading />;

  const { completed } = progress;
  const map = courseMap(course.course);
  const current = currentStage(course.course, completed);
  const isOpen = (s: Stage) => expanded[s] ?? s === current;
  const sections = map.stages.map((row) => ({ key: row.stage.id, row, data: isOpen(row.stage.id) ? row.units : [] }));

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.root, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          title: t('home.title', { language: course.gloss.name }),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" onPress={() => router.push('/languages')} hitSlop={8} style={styles.headerAction}>
                <ThemedText type="linkPrimary">{t('home.changeLanguage')}</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('settings.title')}
                onPress={() => router.push('/settings')}
                style={styles.headerIcon}>
                <ThemedText style={styles.headerIconText}>⚙️</ThemedText>
              </Pressable>
            </View>
          ),
        }}
      />
      <SectionList
        sections={sections}
        keyExtractor={(unit) => unit.unitId}
        stickySectionHeadersEnabled={false}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Overview course={course} />}
        renderSectionHeader={({ section }) => (
          <StageHeader
            course={course}
            row={section.row}
            open={isOpen(section.row.stage.id)}
            onToggle={() => setExpanded((e) => ({ ...e, [section.row.stage.id]: !isOpen(section.row.stage.id) }))}
            completed={completed}
            t={t}
          />
        )}
        renderItem={({ item }) => <UnitCard course={course} unit={item} completed={completed} premium={premium} t={t} />}
      />
    </SafeAreaView>
  );
}

/** Streak, XP, "continue", review and the subscription button. */
function Overview({ course }: { course: CourseBundle }) {
  const { target, premium, progress, t } = useApp();
  const now = new Date();
  const due = dueItems(progress, now, `${target}.`).length;
  const streak = currentStreak(progress.streak, dayKey(now));
  const next = nextLesson(course.course, progress.completed);
  const nextOpen = next && nodeAccess(course.course, next, progress.completed, premium) === 'open';
  return (
    <View style={styles.overview}>
      <View style={styles.stats}>
        <Card style={styles.stat}>
          <ThemedText type="smallBold">🔥 {t('home.streak', { n: streak })}</ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="smallBold">⭐ {t('home.xp', { n: progress.xp })}</ThemedText>
        </Card>
      </View>
      {next && nextOpen ? (
        <Button label={`▶ ${t('home.continue', { title: nodeTitle(course, next, t) })}`} onPress={() => openNode(next, 'open')} />
      ) : null}
      <Button
        variant="secondary"
        disabled={!due}
        label={due ? t('home.review', { n: due }) : t('home.noReview')}
        onPress={() => router.push('/review')}
      />
      {!premium ? <Button variant="secondary" label={`👑 ${t('home.premium')}`} onPress={() => router.push('/paywall')} /> : null}
    </View>
  );
}

function StageHeader({
  course,
  row,
  open,
  onToggle,
  completed,
  t,
}: {
  course: CourseBundle;
  row: StageRow;
  open: boolean;
  onToggle: () => void;
  completed: Record<string, string>;
  t: T;
}) {
  const c = useTheme();
  const { stage } = row;
  const done = row.lessons.filter((id) => id in completed).length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onToggle}
      style={({ pressed }) => [styles.stageHead, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={styles.flex}>
        <ThemedText type="subtitle" style={styles.stageTitle}>
          {stage.id} · {course.gloss.stages[stage.id]?.title}
        </ThemedText>
        <ThemedText type="small" style={{ color: stage.free ? c.success : c.accent }}>
          {stage.free ? t('stage.free') : t('stage.premium')}
          {stage.exam ? ` · ${stage.exam}` : ''}
          {' · '}
          {t('stage.units', { n: row.units.length })}
        </ThemedText>
        <ThemedText type="small" style={{ color: c.textSecondary }}>
          {t('stage.progress', { done, total: row.lessons.length })}
        </ThemedText>
      </View>
      <ThemedText style={[styles.chevron, { color: c.textSecondary }]}>{open ? '▾' : '▸'}</ThemedText>
    </Pressable>
  );
}

function UnitCard({
  course,
  unit,
  completed,
  premium,
  t,
}: {
  course: CourseBundle;
  unit: UnitRow;
  completed: Record<string, string>;
  premium: boolean;
  t: T;
}) {
  const c = useTheme();
  const gloss = course.gloss.units[unit.unitId];
  const done = unit.lessons.filter((id) => id in completed).length;
  const passed = unitTestId(unit.unitId) in completed;
  // The AI tutor role-plays the unit's topic, so it opens once the unit has been started.
  const tutor = apiEnabled && unit.lessons[0] in completed;
  return (
    <Card style={styles.unit}>
      <View style={styles.unitHead}>
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={styles.unitTitle}>
            {gloss?.title ?? unit.unitId}
          </ThemedText>
          {gloss?.goal ? (
            <ThemedText type="small" style={{ color: c.textSecondary }}>
              {gloss.goal}
            </ThemedText>
          ) : null}
        </View>
        {passed ? (
          <View style={[styles.badge, { backgroundColor: c.successSoft }]}>
            <ThemedText type="smallBold" style={{ color: c.success }}>
              🏅 {t('unit.passed')}
            </ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.unitProgress}>
        <View style={styles.flex}>
          <ProgressBar value={unit.lessons.length ? done / unit.lessons.length : 0} />
        </View>
        <ThemedText type="small" style={{ color: c.textSecondary }}>
          {t('unit.progress', { done, total: unit.lessons.length })}
        </ThemedText>
      </View>
      {tutor ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/tutor/[unit]', params: { unit: unit.unitId } })}
          style={({ pressed }) => [styles.node, { backgroundColor: c.background, opacity: pressed ? 0.7 : 1 }]}>
          <ThemedText style={styles.icon}>💬</ThemedText>
          <View style={styles.flex}>
            <ThemedText>{t('tutor.entry')}</ThemedText>
            <ThemedText type="small" style={{ color: c.textSecondary }}>
              {premium ? t('tutor.entryPremium') : t('tutor.entryFree')}
            </ThemedText>
          </View>
          <ThemedText style={[styles.state, { color: c.textSecondary }]}>›</ThemedText>
        </Pressable>
      ) : null}
      {unit.nodes.map((node) => (
        <NodeRow key={node.id} course={course} node={node} completed={completed} premium={premium} t={t} />
      ))}
    </Card>
  );
}

const STATE_ICON = { locked: '🔒', premium: '👑' } as const;

function NodeRow({
  course,
  node,
  completed,
  premium,
  t,
}: {
  course: CourseBundle;
  node: PathNode;
  completed: Record<string, string>;
  premium: boolean;
  t: T;
}) {
  const c = useTheme();
  const access = nodeAccess(course.course, node, completed, premium);
  const done = node.id in completed;
  const minutes =
    node.type === 'practice'
      ? STUDY_MINUTES.practice
      : node.type === 'test'
        ? STUDY_MINUTES.unitTest
        : (course.lessons[node.id]?.lesson.minutes ?? 0);
  const kind = node.type === 'reader' ? `${t('path.reader')} · ` : '';
  const subtitle =
    access === 'locked'
      ? 'covers' in node
        ? t('path.lockedCovers')
        : t('lesson.locked')
      : done
        ? node.type === 'test'
          ? t('path.testPassed')
          : t('lesson.done')
        : access === 'premium'
          ? t('stage.premium')
          : `${kind}${t('lesson.minutes', { n: minutes })}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: access === 'locked' }}
      disabled={access === 'locked'}
      onPress={() => openNode(node, access)}
      style={({ pressed }) => [
        styles.node,
        { backgroundColor: c.background, opacity: access === 'locked' ? 0.5 : pressed ? 0.7 : 1 },
      ]}>
      <ThemedText style={styles.icon}>{NODE_ICON[node.type]}</ThemedText>
      <View style={styles.flex}>
        <ThemedText>{nodeTitle(course, node, t)}</ThemedText>
        <ThemedText type="small" style={{ color: c.textSecondary }}>
          {subtitle}
        </ThemedText>
      </View>
      <ThemedText style={[styles.state, { color: c.textSecondary }]}>
        {done ? '✅' : access === 'open' ? '›' : STATE_ICON[access]}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.six },
  flex: { flex: 1 },
  overview: { gap: Spacing.three, marginBottom: Spacing.two },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center' },
  stageHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three, minHeight: 56 },
  stageTitle: { fontSize: 24, lineHeight: 32 },
  chevron: { fontSize: 22, lineHeight: 28, paddingHorizontal: Spacing.two },
  unit: { marginBottom: Spacing.three },
  unitHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  unitTitle: { fontSize: 16, lineHeight: 24 },
  badge: { borderRadius: Spacing.three, paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  unitProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 56,
  },
  icon: { fontSize: 22, lineHeight: 28 },
  state: { fontSize: 18, lineHeight: 24, minWidth: 24, textAlign: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.two },
  headerAction: { paddingHorizontal: Spacing.two, minHeight: 44, justifyContent: 'center' },
  headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 22, lineHeight: 28 },
});
