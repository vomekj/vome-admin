import { configureClient } from 'vome-core/client'
import { config } from '@/config'

configureClient({ baseUrl: config.baseUrl })
