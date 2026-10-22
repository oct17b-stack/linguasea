import { currentStreak, dayKey, dueItems, lessonAccess, type Access } from '@linguasea/core';
import { Redirect, router, Stack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { courseBundle } from '@/content';
import { useTheme } from '@/hooks/use-theme';
import { useApp } from '@/state/app-state';

const ICON: Record<Access | 'done', string> = { done: '✅', open: '▶️', locked: '🔒', premium: '👑' };

export default function Home() {
  const { l1, target, premium, progress, t } = useApp();
  const c = useTheme();
  const course = target ? courseBundle(l1, target) : undefined;
  if (!target || !course) return <Redirect href="/languages" />;

  const now = new Date();
  const due = dueItems(progress, now, `${target}.`).length;
  const streak = currentStreak(progress.streak, dayKey(now));

  const open = (lessonId: string, access: Access) => {
    if (access === 'premium') router.push('/paywall');
    else if (access === 'open') router.push({ pathname: '/lesson/[id]', params: { id: lessonId } });
  };

  return (
    <Screen>
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

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <ThemedText type="smallBold">🔥 {t('home.streak', { n: streak })}</ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="smallBold">⭐ {t('home.xp', { n: progress.xp })}</ThemedText>
        </Card>
      </View>

      <Button
        variant={due ? 'primary' : 'secondary'}
        disabled={!due}
        label={due ? t('home.review', { n: due }) : t('home.noReview')}
        onPress={() => router.push('/review')}
      />
      {!premium ? <Button variant="secondary" label={`👑 ${t('home.premium')}`} onPress={() => router.push('/paywall')} /> : null}

      {course.course.stages.map((stage) => (
        <View key={stage.id} style={styles.stage}>
          <View style={styles.stageHead}>
            <ThemedText type="subtitle" style={styles.stageTitle}>
              {stage.id} · {course.gloss.stages[stage.id]?.title}
            </ThemedText>
            <ThemedText type="small" style={{ color: stage.free ? c.success : c.accent }}>
              {stage.free ? t('stage.free') : t('stage.premium')}
              {stage.exam ? ` · ${stage.exam}` : ''}
            </ThemedText>
          </View>
          {stage.units.map((unit) => (
            <Card key={unit.id}>
              <ThemedText type="smallBold">{course.gloss.units[unit.id]?.title}</ThemedText>
              {unit.lessons.map((id) => {
                const entry = course.lessons[id];
                if (!entry) return null;
                const access = lessonAccess(course.course, id, progress.completed, premium);
                const done = id in progress.completed;
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="button"
                    disabled={access === 'locked'}
                    onPress={() => open(id, access)}
                    style={[styles.lesson, { backgroundColor: c.background, opacity: access === 'locked' ? 0.5 : 1 }]}>
                    <ThemedText style={styles.icon}>{ICON[done && access === 'open' ? 'done' : access]}</ThemedText>
                    <View style={styles.flex}>
                      <ThemedText>{entry.gloss.title}</ThemedText>
                      <ThemedText type="small" style={{ color: c.textSecondary }}>
                        {access === 'locked'
                          ? t('lesson.locked')
                          : done
                            ? t('lesson.done')
                            : t('lesson.minutes', { n: entry.lesson.minutes })}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center' },
  stage: { gap: Spacing.two, marginTop: Spacing.two },
  stageHead: { gap: Spacing.half },
  stageTitle: { fontSize: 24, lineHeight: 32 },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 56,
  },
  icon: { fontSize: 22, lineHeight: 28 },
  flex: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.two },
  headerAction: { paddingHorizontal: Spacing.two, minHeight: 44, justifyContent: 'center' },
  headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerIconText: { fontSize: 22, lineHeight: 28 },
});
