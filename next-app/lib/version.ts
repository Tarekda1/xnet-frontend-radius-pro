type RuntimeEnv = {
  APP_VERSION?: string;
  APP_BUILD_TIME?: string;
  APP_GIT_SHA?: string;
};

function readRuntimeEnv(): RuntimeEnv {
  try {
    return (window as any)?.__ENV__ ?? {};
  } catch {
    return {};
  }
}

export function getAppVersionInfo(): {
  version: string;
  buildTime?: string;
  gitSha?: string;
  gitShaShort?: string;
} {
  const rt = readRuntimeEnv();

  const version = String(rt.APP_VERSION || __APP_VERSION__ || "0.0.0");
  const buildTime = rt.APP_BUILD_TIME || (__APP_BUILD_TIME__ || undefined);
  const gitSha = rt.APP_GIT_SHA || (__APP_GIT_SHA__ || undefined);
  const gitShaShort = gitSha ? gitSha.slice(0, 7) : undefined;

  return { version, buildTime, gitSha, gitShaShort };
}

