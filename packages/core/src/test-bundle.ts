// Test helper: the real content, bundled the same way the app gets it.
import { buildBundle } from '../../contract/src/build';
import { contentRoot } from '../../contract/src/cli/paths';
import { loadContent } from '../../contract/src/load';

export const bundle = buildBundle(loadContent(contentRoot), 'test');
export const th = bundle.l1s.th!;
