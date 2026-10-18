import { Registry } from 'prom-client';

type ExpectedLabels = Record<string, string | number>;

/**
 * Registry에서 메트릭 샘플 값을 읽는다. 라벨이 모두 일치하는 샘플이 없으면 0을 반환한다.
 * Histogram의 `_count`처럼 샘플 이름이 메트릭 이름과 다르면 sampleName으로 지정한다.
 */
export const readMetricValue = async (
  registry: Registry,
  metricName: string,
  expectedLabels: ExpectedLabels = {},
  sampleName: string = metricName,
): Promise<number> => {
  const metric = registry.getSingleMetric(metricName);
  if (!metric) {
    throw new Error(`메트릭이 등록되어 있지 않습니다: ${metricName}`);
  }

  const { values } = await metric.get();
  const sample = values.find(
    (value) =>
      ('metricName' in value ? value.metricName : metricName) === sampleName &&
      Object.entries(expectedLabels).every(
        ([key, expected]) => String(value.labels[key]) === String(expected),
      ),
  );

  return sample?.value ?? 0;
};
