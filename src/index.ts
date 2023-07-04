import component from './component.js'
import { handleRequest } from './handler'

export default {
  async fetch(
    request: Request,
    _,
    execContext: ExecutionContext
  ): Promise<Response> {
    return handleRequest(request, execContext, component)
  },
}
