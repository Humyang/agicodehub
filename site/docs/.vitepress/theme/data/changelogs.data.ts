import { defineLoader } from 'vitepress'
import { Octokit } from '@octokit/rest'
import type { GetResponseDataTypeFromEndpointMethod } from '@octokit/types'

const octokit = new Octokit()

type GitHubReleaseList = GetResponseDataTypeFromEndpointMethod<typeof octokit.repos.listReleases>

declare const data: GitHubReleaseList
export { data }

export default defineLoader({
  // async load(): Promise<GitHubReleaseList> {
  //   const releases = await octokit.paginate(octokit.repos.listReleases, {
  //     owner: 'Humyang',
  //     repo: 'agicodehub',
  //     per_page: 100,
  //   })

  //   return releases
  // },
  async load(): Promise<any[]> {
    // 返回模拟数据
    const mockReleases = [
      {
        id: 1,
        tag_name: 'v1.0.0',
        name: 'Initial Release',
        body: 'First stable release of the project',
        published_at: '2024-01-01T00:00:00Z',
        prerelease: false,
        draft: false
      },
      {
        id: 2,
        tag_name: 'v0.9.0',
        name: 'Beta Release',
        body: 'Beta version with all core features',
        published_at: '2023-12-15T00:00:00Z',
        prerelease: true,
        draft: false
      }
    ]

    return mockReleases
  },
})
