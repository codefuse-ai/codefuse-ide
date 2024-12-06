import { Injectable } from '@opensumi/di';
import { NodeModule } from '@opensumi/ide-core-node';

@Injectable()
export class CoreNodeModule extends NodeModule {
  providers = [];
}
